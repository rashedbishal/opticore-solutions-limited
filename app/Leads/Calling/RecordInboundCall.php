<?php

namespace App\Leads\Calling;

use App\Leads\Enums\CallDirection;
use App\Leads\Enums\CallEndReason;
use App\Leads\Enums\CallStatus;
use App\Leads\Enums\MessageChannel;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadCall;
use App\Leads\Models\LeadConversation;
use App\Leads\Models\LeadSource;
use App\Leads\Services\LeadDuplicateDetector;
use Closure;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * The only writer of incoming calls (same rules as OptiFin):
 *
 * - connect: find the caller's lead (or create one, like a WhatsApp
 *   message would), decide who rings, store the call Ringing and cache the
 *   encrypted offer. A connect that arrives after its ring window, or after
 *   its own terminate, is recorded already ended and rings nobody.
 * - terminate: end the call with the right outcome. A terminate for an
 *   unknown call is remembered briefly so a late connect can't ring.
 *
 * Meta retries webhooks for days and doesn't keep them in order, so every
 * step is safe to receive twice.
 */
class RecordInboundCall
{
    public function __construct(private readonly CallRouter $router) {}

    /**
     * @param  Closure(): Lead  $createLead
     */
    public function handle(WhatsAppCallEvent $event, LeadSource $source, Closure $createLead, ?Closure $onLeadCreated = null): string
    {
        if ($event->isConnect()) {
            return $source->calling_enabled ? $this->connect($event, $source, $createLead, $onLeadCreated) : 'ignored_calling_disabled';
        }

        return $this->terminate($event, $source);
    }

    /**
     * @param  Closure(): Lead  $createLead
     */
    private function connect(WhatsAppCallEvent $event, LeadSource $source, Closure $createLead, ?Closure $onLeadCreated): string
    {
        if (($existing = $this->find($source, $event->callId)) !== null) {
            return $this->duplicateConnect($existing, $event, $source);
        }

        $phone = (string) $event->callerPhone;

        return $this->withPhoneLock($source, $phone, function () use ($event, $source, $createLead, $onLeadCreated, $phone): string {
            if (($existing = $this->find($source, $event->callId)) !== null) {
                return $this->duplicateConnect($existing, $event, $source);
            }

            if ($this->wasSeen($source, $event->callId)) {
                return 'ignored_seen';
            }

            $tombstone = $this->readTombstone($source, $event->callId);
            $eventAt = $this->eventTime($event);
            $ringEndsAt = $eventAt->copy()->addSeconds((int) config('calling.ring_ttl_seconds'));
            $stale = $ringEndsAt->lte(Carbon::now());
            $lead = $this->existingLead($source, $phone);
            $created = false;

            if ($lead === null) {
                if ($tombstone !== null) {
                    return 'ignored_terminated_unknown_caller';
                }

                if ($stale) {
                    return 'ignored_stale_unknown_caller';
                }

                $lead = $createLead();
                $created = true;
            }

            $terminal = match (true) {
                $tombstone !== null => $this->terminal(
                    $tombstone['has_errors'] ? CallStatus::Failed : CallStatus::Missed,
                    $tombstone['has_errors'] ? CallEndReason::MetaError : CallEndReason::TerminateBeforeConnect,
                    $tombstone['meta_status'],
                    Carbon::now(),
                    $tombstone['ended_at'] !== null ? Carbon::createFromTimestamp($tombstone['ended_at']) : $eventAt,
                ),
                $stale => $this->terminal(CallStatus::Missed, CallEndReason::TerminateBeforeConnect, endedAt: $ringEndsAt),
                default => null,
            };

            $call = $this->create($lead, $created, $source, $event, $eventAt, $terminal);

            if ($created && $onLeadCreated !== null) {
                $onLeadCreated($lead);
            }

            if (is_string($call)) {
                return $call;
            }

            if ($call->status !== CallStatus::Ringing) {
                return $terminal !== null ? 'recorded_ended' : 'recorded_no_recipient';
            }

            if (! $this->cacheOfferOrFail($call, $source, $event)) {
                return 'offer_cache_failed';
            }

            LeadCallBroadcaster::updated($call, CallStatus::Ringing);

            return 'recorded';
        });
    }

    private function duplicateConnect(LeadCall $existing, WhatsAppCallEvent $event, LeadSource $source): string
    {
        if ($existing->conversation_id !== null) {
            $thread = LeadConversation::query()->whereKey($existing->conversation_id)->value('external_thread_id');

            if (is_string($thread) && $thread !== $event->callerPhone) {
                return 'conflict';
            }
        }

        $this->remember($source, $event->callId);

        // A retry can restore an offer the cache lost while still ringing.
        if ($existing->status === CallStatus::Ringing && ! $existing->isExpired() && ! LeadCallSdp::hasOffer($source->id, $event->callId) && $event->sdp !== null) {
            $this->cacheOfferOrFail($existing, $source, $event);
        }

        return 'duplicate';
    }

    private function terminate(WhatsAppCallEvent $event, LeadSource $source): string
    {
        if (($existing = $this->find($source, $event->callId)) !== null) {
            $this->remember($source, $event->callId);

            return $this->applyTerminate($existing->id, $event);
        }

        if (! $source->calling_enabled) {
            return 'ignored_calling_disabled';
        }

        if ($this->wasSeen($source, $event->callId)) {
            return 'ignored_seen';
        }

        $phone = $event->callerPhone;

        if ($phone === null) {
            $this->storeTombstone($source, $event);

            return 'terminate_tombstoned';
        }

        return $this->withPhoneLock($source, $phone, function () use ($event, $source, $phone): string {
            if (($existing = $this->find($source, $event->callId)) !== null) {
                return $this->applyTerminate($existing->id, $event);
            }

            $lead = $this->existingLead($source, $phone);

            if ($lead === null) {
                $this->storeTombstone($source, $event);

                return 'terminate_tombstoned';
            }

            // We never saw this call's connect: record it already ended.
            $eventAt = $this->eventTime($event);
            $call = $this->create($lead, false, $source, $event, $eventAt, $this->terminal(
                $event->hasErrors ? CallStatus::Failed : CallStatus::Missed,
                $event->hasErrors ? CallEndReason::MetaError : CallEndReason::TerminateBeforeConnect,
                $event->rawMetaStatus(),
                Carbon::now(),
                $event->endTime !== null ? Carbon::createFromTimestamp($event->endTime) : $eventAt,
                $event->duration,
            ));

            return is_string($call) ? $call : 'terminate_recorded';
        });
    }

    private function applyTerminate(string $callId, WhatsAppCallEvent $event): string
    {
        $changed = null;

        $outcome = DB::transaction(function () use ($callId, $event, &$changed): string {
            $call = LeadCall::query()->whereKey($callId)->lockForUpdate()->first();

            if ($call === null || $call->meta_terminated_at !== null) {
                return 'terminate_noop';
            }

            $endedAt = $event->endTime !== null ? Carbon::createFromTimestamp($event->endTime) : $this->eventTime($event);
            $updates = ['meta_terminated_at' => Carbon::now()];

            if ($call->meta_status === null && $event->rawMetaStatus() !== null) {
                $updates['meta_status'] = $event->rawMetaStatus();
            }

            if ($call->status->isTerminal()) {
                // We already ended it (e.g. hung up); only fill gaps.
                if ($call->ended_at === null) {
                    $updates['ended_at'] = $endedAt;
                }

                if ($call->duration_seconds === null && $event->duration !== null) {
                    $updates['duration_seconds'] = $event->duration;
                }

                $call->update($updates);

                return 'terminate_filled';
            }

            [$next, $reason] = match ($call->status) {
                CallStatus::Ringing => $event->hasErrors
                    ? [CallStatus::Failed, CallEndReason::MetaError]
                    : [CallStatus::Missed, CallEndReason::CallerEndedOrNotAnswered],
                CallStatus::Answering => match (true) {
                    $event->hasErrors => [CallStatus::Failed, CallEndReason::MetaError],
                    $event->pickedUp() && $event->statusMentions('COMPLETED') => [CallStatus::Completed, CallEndReason::CompletedUnconfirmedLocally],
                    default => [CallStatus::Missed, CallEndReason::EndedBeforeConnect],
                },
                CallStatus::Connected => $event->hasErrors || $event->statusMentions('FAILED')
                    ? [CallStatus::Failed, CallEndReason::MetaFailedAfterConnect]
                    : [CallStatus::Completed, CallEndReason::RemoteTerminated],
                default => [$call->status, CallEndReason::RemoteTerminated],
            };

            if (! $call->status->canTransitionTo($next)) {
                return 'terminate_noop';
            }

            $updates += ['status' => $next, 'end_reason' => $reason, 'ended_at' => $endedAt, 'duration_seconds' => $event->duration];

            if ($call->status === CallStatus::Answering && $next === CallStatus::Completed && $event->startTime !== null) {
                $updates['connected_at'] = Carbon::createFromTimestamp($event->startTime);
            }

            $call->update($updates);
            $changed = [$call, $next];

            return 'terminate_applied';
        });

        if ($changed !== null) {
            LeadCallSdp::forget($changed[0]->lead_source_id, $changed[0]->external_call_id);
            LeadCallBroadcaster::updated($changed[0], $changed[1]);
        }

        return $outcome;
    }

    /**
     * @param  array<string, mixed>|null  $terminal
     */
    private function create(Lead $lead, bool $created, LeadSource $source, WhatsAppCallEvent $event, Carbon $eventAt, ?array $terminal): LeadCall|string
    {
        try {
            $call = DB::transaction(function () use ($lead, $created, $source, $event, $eventAt, $terminal): LeadCall {
                $conversation = LeadConversation::query()->firstOrCreate(
                    ['lead_source_id' => $source->id, 'channel' => MessageChannel::Whatsapp, 'external_thread_id' => (string) $event->callerPhone],
                    ['lead_id' => $lead->id],
                );

                if ($conversation->last_inbound_at === null || $conversation->last_inbound_at->lt($eventAt)) {
                    $conversation->update(['last_inbound_at' => $eventAt]);
                }

                $routing = $this->router->route($lead, $created);
                $attributes = [
                    'lead_id' => $lead->id,
                    'lead_source_id' => $source->id,
                    'conversation_id' => $conversation->id,
                    'external_call_id' => $event->callId,
                    'routing_mode' => $routing['routing_mode'],
                    'routed_user_ids' => $routing['routed_user_ids'],
                    'assignee_id_at_arrival' => $routing['assignee_id_at_arrival'],
                ];

                if ($terminal !== null) {
                    $attributes += $terminal + ['ringing_expires_at' => null];
                } elseif ($routing['routed_user_ids'] === []) {
                    $attributes += ['status' => CallStatus::Missed, 'end_reason' => CallEndReason::NoRecipient, 'ended_at' => Carbon::now(), 'ringing_expires_at' => null];
                } else {
                    $attributes += ['status' => CallStatus::Ringing, 'ringing_expires_at' => $eventAt->copy()->addSeconds((int) config('calling.ring_ttl_seconds'))];
                }

                return LeadCall::query()->create($attributes);
            });
        } catch (UniqueConstraintViolationException) {
            $existing = $this->find($source, $event->callId);

            if ($existing === null) {
                return 'duplicate';
            }

            return $event->isConnect() ? $this->duplicateConnect($existing, $event, $source) : $this->applyTerminate($existing->id, $event);
        }

        $this->remember($source, $event->callId);

        if ($call->status === CallStatus::Missed) {
            LeadCallBroadcaster::missed($call);
        }

        return $call;
    }

    private function find(LeadSource $source, string $callId): ?LeadCall
    {
        return LeadCall::query()->where('lead_source_id', $source->id)->where('direction', CallDirection::Inbound->value)->where('external_call_id', $callId)->first();
    }

    private function existingLead(LeadSource $source, string $phone): ?Lead
    {
        $lead = LeadConversation::query()
            ->where('lead_source_id', $source->id)
            ->where('channel', MessageChannel::Whatsapp)
            ->where('external_thread_id', $phone)
            ->first()?->lead;

        return $lead ?? Lead::query()->withMerged()->where('source_id', $source->id)->where('phone_normalized', LeadDuplicateDetector::normalizePhone($phone))->first()?->latestVersion();
    }

    private function withPhoneLock(LeadSource $source, string $phone, Closure $callback): string
    {
        return (string) Cache::lock("lead-webhook-dedupe:{$source->id}:{$phone}", 10)->block(5, $callback);
    }

    private function cacheOfferOrFail(LeadCall $call, LeadSource $source, WhatsAppCallEvent $event): bool
    {
        if ($event->sdp !== null && LeadCallSdp::storeOffer($source->id, $event->callId, $event->sdp)) {
            return true;
        }

        LeadCall::query()->whereKey($call->id)->where('status', CallStatus::Ringing->value)->update([
            'status' => CallStatus::Failed->value,
            'end_reason' => CallEndReason::SdpCacheFailure->value,
            'ended_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        return false;
    }

    private function remember(LeadSource $source, string $callId): void
    {
        try {
            Cache::put("wa-call-seen:{$source->id}:{$callId}", 1, Carbon::now()->addSeconds((int) config('calling.seen_ttl_seconds')));
        } catch (Throwable) {
            // Best effort.
        }
    }

    private function wasSeen(LeadSource $source, string $callId): bool
    {
        try {
            return Cache::has("wa-call-seen:{$source->id}:{$callId}");
        } catch (Throwable) {
            return false;
        }
    }

    private function storeTombstone(LeadSource $source, WhatsAppCallEvent $event): void
    {
        try {
            Cache::put("wa-call-tombstone:{$source->id}:{$event->callId}", [
                'meta_status' => $event->rawMetaStatus(),
                'has_errors' => $event->hasErrors,
                'ended_at' => $event->endTime,
            ], Carbon::now()->addSeconds((int) config('calling.tombstone_ttl_seconds')));
        } catch (Throwable) {
            // Best effort.
        }
    }

    /**
     * @return array{meta_status: string|null, has_errors: bool, ended_at: int|null}|null
     */
    private function readTombstone(LeadSource $source, string $callId): ?array
    {
        try {
            $value = Cache::get("wa-call-tombstone:{$source->id}:{$callId}");
        } catch (Throwable) {
            return null;
        }

        if (! is_array($value)) {
            return null;
        }

        return [
            'meta_status' => is_string($value['meta_status'] ?? null) ? $value['meta_status'] : null,
            'has_errors' => ($value['has_errors'] ?? false) === true,
            'ended_at' => is_int($value['ended_at'] ?? null) ? $value['ended_at'] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function terminal(CallStatus $status, CallEndReason $reason, ?string $metaStatus = null, ?Carbon $metaTerminatedAt = null, ?Carbon $endedAt = null, ?int $duration = null): array
    {
        return [
            'status' => $status,
            'end_reason' => $reason,
            'meta_status' => $metaStatus,
            'meta_terminated_at' => $metaTerminatedAt,
            'ended_at' => $endedAt,
            'duration_seconds' => $duration,
        ];
    }

    /** Meta's own time, but never in the future. */
    private function eventTime(WhatsAppCallEvent $event): Carbon
    {
        return Carbon::createFromTimestamp(min($event->timestamp, Carbon::now()->getTimestamp()));
    }
}
