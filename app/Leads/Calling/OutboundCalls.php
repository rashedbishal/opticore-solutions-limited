<?php

namespace App\Leads\Calling;

use App\Leads\Enums\CallDirection;
use App\Leads\Enums\CallEndReason;
use App\Leads\Enums\CallRoutingMode;
use App\Leads\Enums\CallStatus;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadCall;
use App\Leads\Models\LeadSource;
use App\Models\Admin;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Calling a lead (same flow as OptiFin):
 * the browser makes an offer → we re-check permission live with Meta →
 * record the call "starting" → Meta dials and returns its id (Ringing) →
 * when the lead picks up, Meta's webhook brings their answer (Answering) →
 * the browser fetches it, connects the audio and only then confirms
 * (Connected). Before pickup the caller can Cancel; afterwards Hang up.
 */
class OutboundCalls
{
    public function __construct(private readonly CallPermissions $permissions) {}

    public function initiate(Admin $admin, Lead $lead, mixed $sdpOffer): LeadCallActionResult
    {
        if (! $this->permissions->canCall($admin, $lead)) {
            return LeadCallActionResult::error(403, 'forbidden', 'Only the lead\'s person or a manager can call this lead.');
        }

        $source = $this->permissions->sourceFor($lead);

        if ($source === null || $this->permissions->waId($lead) === null) {
            return LeadCallActionResult::error(422, 'no_whatsapp_source', 'This lead has no WhatsApp number to call.');
        }

        if (! $source->is_active || ! $source->calling_enabled) {
            return LeadCallActionResult::error(409, 'calling_unavailable', 'Calling is not turned on for this WhatsApp number.');
        }

        $offer = LeadCallSdp::normalizeAnswer($sdpOffer);

        if ($offer === null) {
            return LeadCallActionResult::error(422, 'invalid_sdp', 'The call could not be set up in this browser.');
        }

        $permission = $this->permissions->check($lead, $source);

        if (! $permission->successful) {
            return LeadCallActionResult::error(502, 'permission_check_failed', $permission->userMessage() ?: 'Could not check the permission with WhatsApp.', $permission->error?->retryable() ?? false);
        }

        if (($permission->data['actions']['start_call'] ?? false) !== true) {
            return LeadCallActionResult::error(409, 'permission_required', 'This person hasn\'t allowed calls from you. Ask for permission first.');
        }

        $call = $this->createStarting($admin, $lead, $source);

        if ($call === null) {
            return LeadCallActionResult::error(409, 'call_already_in_progress', 'A call to this lead is already in progress.');
        }

        $api = (new WhatsAppCallingClient($source))->connect((string) $this->permissions->waId($lead), $offer, $call->biz_opaque_callback_data);

        if (! $api->successful) {
            LeadCall::query()->whereKey($call->id)->where('status', CallStatus::Initiated->value)->update([
                'status' => CallStatus::Failed->value,
                'end_reason' => CallEndReason::OutboundConnectFailed->value,
                'ended_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            return LeadCallActionResult::error(502, 'meta_rejected', $api->userMessage());
        }

        $wacid = (string) ($api->data['wacid'] ?? '');

        $ringing = LeadCall::query()->whereKey($call->id)->where('status', CallStatus::Initiated->value)->whereNull('external_call_id')->update([
            'external_call_id' => $wacid,
            'status' => CallStatus::Ringing->value,
            'ringing_expires_at' => Carbon::now()->addSeconds((int) config('calling.ring_ttl_seconds')),
            'updated_at' => Carbon::now(),
        ]) === 1;

        if (! $ringing) {
            // Cancelled while Meta was dialling: record its id and hang up there too.
            $updated = LeadCall::query()->whereKey($call->id)->whereNull('external_call_id')->update(['external_call_id' => $wacid, 'updated_at' => Carbon::now()]) === 1;

            if ($updated) {
                (new WhatsAppCallingClient($source))->terminate($wacid);
            }

            return LeadCallActionResult::success(LeadCall::query()->find($call->id) ?? $call);
        }

        $fresh = LeadCall::query()->find($call->id) ?? $call;
        LeadCallBroadcaster::updated($fresh, CallStatus::Ringing);

        return LeadCallActionResult::success($fresh);
    }

    /** The lead's answer, once they've picked up. */
    public function answer(Admin $admin, string $callId): LeadCallActionResult
    {
        [$call, $refusal] = $this->mine($admin, $callId);

        if ($refusal !== null) {
            return $refusal;
        }

        if ($call->status->isTerminal()) {
            return LeadCallActionResult::error(409, 'call_not_active', 'This call has ended.');
        }

        if (! in_array($call->status, [CallStatus::Answering, CallStatus::Connected], true)) {
            return LeadCallActionResult::error(409, 'answer_not_yet_available', 'They haven\'t picked up yet.', true);
        }

        $answer = LeadCallSdp::readAnswer($call->lead_source_id, (string) $call->external_call_id);

        return $answer === null
            ? LeadCallActionResult::error(409, 'answer_unavailable', 'This call can no longer be connected.')
            : LeadCallActionResult::success($call, ['sdp_type' => 'answer', 'sdp' => $answer]);
    }

    /** The browser's audio really connected: only now is the call "on". */
    public function confirmConnected(Admin $admin, string $callId): LeadCallActionResult
    {
        [$call, $refusal] = $this->mine($admin, $callId);

        if ($refusal !== null) {
            return $refusal;
        }

        if ($call->status === CallStatus::Connected) {
            return LeadCallActionResult::success($call);
        }

        $applied = LeadCall::query()->whereKey($call->id)->where('status', CallStatus::Answering->value)->where('claimed_by', $admin->id)->update([
            'status' => CallStatus::Connected->value,
            'connected_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]) === 1;

        $fresh = LeadCall::query()->find($call->id) ?? $call;

        if (! $applied) {
            return $fresh->status === CallStatus::Connected
                ? LeadCallActionResult::success($fresh)
                : LeadCallActionResult::error(409, 'call_not_confirmable', 'This call can no longer be connected.');
        }

        LeadCallSdp::forget($call->lead_source_id, (string) $call->external_call_id);
        LeadCallBroadcaster::updated($fresh, CallStatus::Connected);

        return LeadCallActionResult::success($fresh);
    }

    /** Stop dialling before the lead picks up. */
    public function cancel(Admin $admin, string $callId): LeadCallActionResult
    {
        [$call, $refusal] = $this->mine($admin, $callId);

        if ($refusal !== null) {
            return $refusal;
        }

        if ($call->status->isTerminal()) {
            return LeadCallActionResult::success($call);
        }

        if (! in_array($call->status, [CallStatus::Initiated, CallStatus::Ringing, CallStatus::Answering], true)) {
            return LeadCallActionResult::error(409, 'call_not_cancellable', 'The call is connected — use Hang up.');
        }

        $won = LeadCall::query()->whereKey($call->id)->where('status', $call->status->value)->where('claimed_by', $admin->id)->update([
            'status' => CallStatus::Failed->value,
            'end_reason' => CallEndReason::AgentCancelledOutbound->value,
            'ended_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]) === 1;

        if (! $won) {
            $fresh = LeadCall::query()->find($call->id);

            return $fresh !== null && $fresh->status->isTerminal()
                ? LeadCallActionResult::success($fresh)
                : LeadCallActionResult::error(409, 'call_not_cancellable', 'The call changed — try again.');
        }

        LeadCallBroadcaster::updated($call, CallStatus::Failed);
        $source = LeadSource::query()->find($call->lead_source_id);

        if ($source !== null && $call->external_call_id !== null) {
            (new WhatsAppCallingClient($source))->terminate($call->external_call_id);
            LeadCallSdp::forget($source->id, $call->external_call_id);
        }

        return LeadCallActionResult::success(LeadCall::query()->find($call->id) ?? $call);
    }

    private function createStarting(Admin $admin, Lead $lead, LeadSource $source): ?LeadCall
    {
        return Cache::lock("wa-outbound-initiate:{$lead->id}", 10)->block(5, function () use ($admin, $lead, $source): ?LeadCall {
            $active = LeadCall::query()->where('lead_id', $lead->id)->where('direction', CallDirection::Outbound->value)
                ->whereIn('status', CallStatus::activeValues())->exists();

            if ($active) {
                return null;
            }

            return LeadCall::query()->create([
                'lead_id' => $lead->id,
                'lead_source_id' => $source->id,
                'direction' => CallDirection::Outbound,
                'external_call_id' => null,
                'biz_opaque_callback_data' => (string) Str::ulid(),
                'status' => CallStatus::Initiated,
                'routing_mode' => CallRoutingMode::AgentInitiated,
                'routed_user_ids' => [(int) $admin->id],
                'assignee_id_at_arrival' => $lead->assigned_to,
                'claimed_by' => $admin->id,
                'claimed_by_name' => $admin->name,
                'claimed_at' => Carbon::now(),
            ]);
        });
    }

    /**
     * @return array{0: LeadCall, 1: null}|array{0: null, 1: LeadCallActionResult}
     */
    private function mine(Admin $admin, string $callId): array
    {
        $call = LeadCall::query()->where('direction', CallDirection::Outbound->value)->find($callId);

        if ($call === null) {
            return [null, LeadCallActionResult::notFound()];
        }

        if ($call->claimed_by !== (int) $admin->id) {
            return [null, LeadCallActionResult::error(403, 'not_claimant', 'Only the person who placed this call can do that.')];
        }

        return [$call, null];
    }
}
