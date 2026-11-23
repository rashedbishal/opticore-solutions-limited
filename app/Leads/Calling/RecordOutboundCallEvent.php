<?php

namespace App\Leads\Calling;

use App\Leads\Enums\CallDirection;
use App\Leads\Enums\CallEndReason;
use App\Leads\Enums\CallStatus;
use App\Leads\Models\LeadCall;
use App\Leads\Models\LeadSource;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Meta's webhooks for a call we dialled (same rules as OptiFin):
 * connect → the lead picked up (store their answer, Answering);
 * terminate → the call ended; a RINGING/ACCEPTED/REJECTED status is only
 * informational (the browser's real audio is the only "connected" proof),
 * but REJECTED lets the end be shown as "They declined".
 */
class RecordOutboundCallEvent
{
    /**
     * @param  array<string, mixed>  $call
     */
    public function handle(LeadSource $source, array $call): string
    {
        $id = $call['id'] ?? null;
        $event = $call['event'] ?? null;

        if (! is_string($id) || $id === '' || strlen($id) > 191 || ! in_array($event, ['connect', 'terminate'], true)) {
            return 'ignored_malformed';
        }

        $record = $this->find($source, $id);

        if ($record === null) {
            return 'unknown_call';
        }

        return $event === 'connect' ? $this->answered($record, $source, $call) : $this->ended($record, $source, $call);
    }

    /**
     * @param  array<string, mixed>  $status
     */
    public function status(LeadSource $source, array $status): string
    {
        $id = $status['id'] ?? null;
        $value = is_string($status['status'] ?? null) ? strtoupper(trim($status['status'])) : null;

        if (! is_string($id) || $id === '' || ! in_array($value, ['RINGING', 'ACCEPTED', 'REJECTED'], true)) {
            return 'ignored';
        }

        $record = $this->find($source, $id);

        if ($record === null) {
            return 'unknown_call';
        }

        if ($value === 'ACCEPTED') {
            LeadCall::query()->whereKey($record->id)->whereNull('consumer_accepted_at')->update(['consumer_accepted_at' => Carbon::now(), 'updated_at' => Carbon::now()]);
        }

        if ($value === 'REJECTED') {
            try {
                Cache::put("wa-outbound-declined:{$source->id}:{$id}", true, Carbon::now()->addSeconds((int) config('calling.ring_ttl_seconds')));
            } catch (Throwable) {
                // Only affects the wording of the end reason.
            }
        }

        return strtolower($value);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function answered(LeadCall $call, LeadSource $source, array $payload): string
    {
        if ($call->status !== CallStatus::Ringing) {
            return 'noop';
        }

        $session = is_array($payload['session'] ?? null) ? $payload['session'] : [];
        $answer = ($session['sdp_type'] ?? null) === 'answer' ? LeadCallSdp::normalizeAnswer($session['sdp'] ?? null) : null;

        if ($answer === null) {
            return 'invalid_answer';
        }

        if (! LeadCallSdp::storeAnswer($source->id, (string) $call->external_call_id, $answer)) {
            return 'answer_cache_failed';
        }

        $applied = LeadCall::query()->whereKey($call->id)->where('status', CallStatus::Ringing->value)
            ->update(['status' => CallStatus::Answering->value, 'updated_at' => Carbon::now()]) === 1;

        if ($applied) {
            LeadCallBroadcaster::updated($call, CallStatus::Answering);
        }

        return $applied ? 'answering' : 'noop';
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function ended(LeadCall $call, LeadSource $source, array $payload): string
    {
        $endTime = $this->positiveInt($payload['end_time'] ?? null);
        $duration = $this->positiveInt($payload['duration'] ?? null);
        $endedAt = $endTime !== null ? Carbon::createFromTimestamp($endTime) : Carbon::now();
        $errors = $payload['errors'] ?? null;
        $hasErrors = is_array($errors) && $errors !== [];

        if ($call->status->isTerminal()) {
            LeadCall::query()->whereKey($call->id)->whereNull('ended_at')->update(['ended_at' => $endedAt, 'updated_at' => Carbon::now()]);

            if ($duration !== null) {
                LeadCall::query()->whereKey($call->id)->whereNull('duration_seconds')->update(['duration_seconds' => $duration]);
            }

            return 'terminate_filled';
        }

        [$next, $reason] = match ($call->status) {
            CallStatus::Ringing => [CallStatus::Failed, $hasErrors ? CallEndReason::OutboundConnectFailed : ($this->declined($source, $call) ? CallEndReason::ConsumerDeclinedOutbound : CallEndReason::ConsumerNoAnswerOutbound)],
            CallStatus::Answering => [CallStatus::Failed, $this->declined($source, $call) ? CallEndReason::ConsumerDeclinedOutbound : CallEndReason::OutboundConnectFailed],
            CallStatus::Connected => [CallStatus::Completed, $hasErrors ? CallEndReason::MetaFailedAfterConnect : CallEndReason::RemoteTerminated],
            default => [CallStatus::Failed, CallEndReason::OutboundConnectFailed],
        };

        $applied = LeadCall::query()->whereKey($call->id)->where('status', $call->status->value)->update([
            'status' => $next->value,
            'end_reason' => $reason->value,
            'meta_terminated_at' => Carbon::now(),
            'ended_at' => $endedAt,
            'duration_seconds' => $duration ?? ($call->connected_at !== null ? (int) round($call->connected_at->diffInSeconds($endedAt)) : null),
            'updated_at' => Carbon::now(),
        ]) === 1;

        if (! $applied) {
            return 'terminate_noop';
        }

        LeadCallSdp::forget($source->id, (string) $call->external_call_id);
        LeadCallBroadcaster::updated($call, $next);

        return 'terminate_applied';
    }

    private function declined(LeadSource $source, LeadCall $call): bool
    {
        try {
            return (bool) Cache::pull("wa-outbound-declined:{$source->id}:{$call->external_call_id}");
        } catch (Throwable) {
            return false;
        }
    }

    private function find(LeadSource $source, string $id): ?LeadCall
    {
        return LeadCall::query()->where('lead_source_id', $source->id)->where('direction', CallDirection::Outbound->value)->where('external_call_id', $id)->first();
    }

    private function positiveInt(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value > 0 ? $value : null;
        }

        return is_string($value) && ctype_digit($value) && (int) $value > 0 ? (int) $value : null;
    }
}
