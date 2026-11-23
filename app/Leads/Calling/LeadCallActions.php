<?php

namespace App\Leads\Calling;

use App\Leads\Enums\CallEndReason;
use App\Leads\Enums\CallMetaStage;
use App\Leads\Enums\CallStatus;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadCall;
use App\Leads\Models\LeadSource;
use App\Models\Admin;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * What the call box can do, with OptiFin's safety rules:
 *
 * - Only someone the call rang for may act on it.
 * - claim: the first to press Answer wins (one conditional update) and gets
 *   the caller's offer; everyone else stops ringing.
 * - answer (Meta "pre_accept") then accept (Meta "accept") are separate
 *   steps; accept only after the browser's audio connects, and always with
 *   the same answer SDP.
 * - reject: Decline ends the call for everyone. hangup: end a live call.
 *
 * Our database is always updated before Meta is asked, and no database lock
 * is ever held across a Meta request.
 */
class LeadCallActions
{
    public function claim(Admin $admin, string $callId): LeadCallActionResult
    {
        [$call, $source, $refusal] = $this->load($admin, $callId);

        if ($refusal !== null) {
            return $refusal;
        }

        if ($call->status === CallStatus::Answering) {
            return $this->repeatClaim($admin, $call, $source);
        }

        if ($call->status !== CallStatus::Ringing) {
            return $this->refuse($admin, $call, 'claim', 409, 'call_not_active', 'This call is no longer ringing.');
        }

        if ($call->isExpired()) {
            return $this->refuse($admin, $call, 'claim', 409, 'call_expired', 'This call has expired.');
        }

        if (! $source->is_active || ! $source->calling_enabled) {
            return $this->refuse($admin, $call, 'claim', 409, 'calling_unavailable', 'Calling is not available for this WhatsApp number.');
        }

        $offer = LeadCallSdp::readOffer($source->id, $call->external_call_id);

        if ($offer === null) {
            $failed = $this->scoped($call)->where('status', CallStatus::Ringing->value)->whereNull('claimed_by')
                ->update($this->ended(CallStatus::Failed, CallEndReason::SdpCacheFailure)) === 1;

            if ($failed) {
                LeadCallBroadcaster::updated($call, CallStatus::Failed);

                return LeadCallActionResult::error(409, 'offer_unavailable', 'This call can no longer be answered.');
            }

            return $this->afterLostClaim($admin, $call, $source);
        }

        $won = $this->scoped($call)
            ->where('status', CallStatus::Ringing->value)
            ->whereNull('claimed_by')
            ->where('ringing_expires_at', '>', Carbon::now())
            ->update([
                'status' => CallStatus::Answering->value,
                'claimed_by' => $admin->id,
                'claimed_by_name' => $admin->name,
                'claimed_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]) === 1;

        if (! $won) {
            return $this->afterLostClaim($admin, $call, $source);
        }

        $this->log('claim', $admin, $call, 'claimed');
        LeadCallBroadcaster::updated($call, CallStatus::Answering);

        return LeadCallActionResult::success($this->fresh($call) ?? $call, ['sdp_type' => 'offer', 'sdp' => $offer]);
    }

    public function answer(Admin $admin, string $callId, mixed $sdpType, mixed $sdp): LeadCallActionResult
    {
        [$call, $source, $refusal] = $this->load($admin, $callId);

        if ($refusal !== null) {
            return $refusal;
        }

        if (($refusal = $this->claimantRefusal('answer', $admin, $call)) !== null) {
            return $refusal;
        }

        $answer = $sdpType === 'answer' ? LeadCallSdp::normalizeAnswer($sdp) : null;

        if ($answer === null) {
            return $this->refuse($admin, $call, 'answer', 422, 'invalid_sdp', 'The answer SDP is missing or not valid.');
        }

        if ($call->meta_stage === CallMetaStage::PreAccepted) {
            return $this->repeatedAnswer($admin, $call, $source, $answer);
        }

        return $this->withActionLock($call, function () use ($admin, $call, $source, $answer): LeadCallActionResult {
            $current = $this->fresh($call);

            if ($current === null) {
                return LeadCallActionResult::notFound();
            }

            if (($refusal = $this->claimantRefusal('answer', $admin, $current)) !== null) {
                return $refusal;
            }

            if ($current->meta_stage === CallMetaStage::PreAccepted) {
                return $this->repeatedAnswer($admin, $current, $source, $answer);
            }

            $cached = LeadCallSdp::readAnswer($source->id, $current->external_call_id);

            if ($cached !== null && $cached !== $answer) {
                return $this->refuse($admin, $current, 'answer', 409, 'sdp_mismatch', 'Send the same answer as your first attempt.');
            }

            if ($cached === null && ! LeadCallSdp::storeAnswer($source->id, $current->external_call_id, $answer)) {
                return LeadCallActionResult::error(503, 'sdp_cache_unavailable', 'The call could not be processed right now. Try again.', true);
            }

            $api = (new WhatsAppCallingClient($source))->preAccept($current->external_call_id, $answer);

            if (! $api->successful) {
                return $this->metaFailure('answer', $admin, $current, $source, $api, CallEndReason::PreAcceptFailed);
            }

            $applied = $this->scoped($current)
                ->where('status', CallStatus::Answering->value)
                ->where('claimed_by', $admin->id)
                ->whereNull('meta_stage')
                ->update(['meta_stage' => CallMetaStage::PreAccepted->value, 'updated_at' => Carbon::now()]) === 1;

            if (! $applied) {
                return $this->stateChanged('answer', $admin, $current, $source);
            }

            $this->log('answer', $admin, $current, 'pre_accepted');

            return LeadCallActionResult::success($this->fresh($current) ?? $current);
        });
    }

    public function accept(Admin $admin, string $callId): LeadCallActionResult
    {
        [$call, $source, $refusal] = $this->load($admin, $callId);

        if ($refusal !== null) {
            return $refusal;
        }

        if (($done = $this->alreadyConnected($admin, $call)) !== null) {
            return $done;
        }

        if (($refusal = $this->claimantRefusal('accept', $admin, $call)) !== null) {
            return $refusal;
        }

        if ($call->meta_stage !== CallMetaStage::PreAccepted) {
            return $this->refuse($admin, $call, 'accept', 409, 'pre_accept_required', 'Answer the call before accepting it.');
        }

        return $this->withActionLock($call, function () use ($admin, $call, $source): LeadCallActionResult {
            $current = $this->fresh($call);

            if ($current === null) {
                return LeadCallActionResult::notFound();
            }

            if (($done = $this->alreadyConnected($admin, $current)) !== null) {
                return $done;
            }

            if (($refusal = $this->claimantRefusal('accept', $admin, $current)) !== null) {
                return $refusal;
            }

            $answer = LeadCallSdp::readAnswer($source->id, $current->external_call_id);

            if ($answer === null) {
                if ($this->failAnswering($current, $admin, CallEndReason::SdpCacheFailure)) {
                    LeadCallBroadcaster::updated($current, CallStatus::Failed);
                }

                LeadCallSdp::forget($source->id, $current->external_call_id);

                return $this->refuse($admin, $current, 'accept', 409, 'answer_unavailable', 'This call can no longer be answered.');
            }

            $api = (new WhatsAppCallingClient($source))->accept($current->external_call_id, $answer);

            if (! $api->successful) {
                return $this->metaFailure('accept', $admin, $current, $source, $api, CallEndReason::AcceptFailed);
            }

            $applied = $this->scoped($current)
                ->where('status', CallStatus::Answering->value)
                ->where('claimed_by', $admin->id)
                ->where('meta_stage', CallMetaStage::PreAccepted->value)
                ->update([
                    'status' => CallStatus::Connected->value,
                    'connected_at' => Carbon::now(),
                    'meta_stage' => CallMetaStage::Accepted->value,
                    'updated_at' => Carbon::now(),
                ]) === 1;

            if (! $applied) {
                return $this->stateChanged('accept', $admin, $current, $source);
            }

            LeadCallSdp::forget($source->id, $current->external_call_id);
            $this->log('accept', $admin, $current, 'connected');
            LeadCallBroadcaster::updated($current, CallStatus::Connected);

            return LeadCallActionResult::success($this->fresh($current) ?? $current);
        });
    }

    public function reject(Admin $admin, string $callId): LeadCallActionResult
    {
        [$call, $source, $refusal] = $this->load($admin, $callId);

        if ($refusal !== null) {
            return $refusal;
        }

        for ($attempt = 0; $attempt < 2; $attempt++) {
            $won = match ($call->status) {
                CallStatus::Ringing => $this->scoped($call)->where('status', CallStatus::Ringing->value)->whereNull('claimed_by')
                    ->update($this->ended(CallStatus::Rejected, CallEndReason::AgentRejected)) === 1,
                CallStatus::Answering => $call->claimed_by === (int) $admin->id
                    ? $this->scoped($call)->where('status', CallStatus::Answering->value)->where('claimed_by', $admin->id)
                        ->update($this->ended(CallStatus::Rejected, CallEndReason::AgentCancelledDuringAnswer)) === 1
                    : 'not_claimant',
                CallStatus::Rejected => 'already',
                default => 'conflict',
            };

            if ($won === true) {
                LeadCallBroadcaster::updated($call, CallStatus::Rejected);
                $api = (new WhatsAppCallingClient($source))->reject($call->external_call_id);
                LeadCallSdp::forget($source->id, $call->external_call_id);
                $this->log('reject', $admin, $call, $api->successful ? 'rejected' : 'rejected_meta_unconfirmed');

                return LeadCallActionResult::success($this->fresh($call) ?? $call);
            }

            if ($won === 'not_claimant') {
                return $this->refuse($admin, $call, 'reject', 403, 'not_claimant', 'Only the person answering this call can decline it.');
            }

            if ($won === 'already') {
                return LeadCallActionResult::success($call);
            }

            if ($won === 'conflict') {
                break;
            }

            $call = $this->fresh($call);

            if ($call === null) {
                return LeadCallActionResult::notFound();
            }
        }

        return $this->refuse($admin, $call, 'reject', 409, 'call_not_rejectable', 'This call can no longer be declined.');
    }

    public function hangup(Admin $admin, string $callId): LeadCallActionResult
    {
        [$call, $source, $refusal] = $this->load($admin, $callId);

        if ($refusal !== null) {
            return $refusal;
        }

        if ($call->claimed_by !== (int) $admin->id) {
            return $this->refuse($admin, $call, 'hangup', 403, 'not_claimant', 'Only the person on this call can end it.');
        }

        if ($call->status->isTerminal()) {
            return LeadCallActionResult::success($call);
        }

        if ($call->status !== CallStatus::Connected) {
            return $this->refuse($admin, $call, 'hangup', 409, 'call_not_connected', 'This call is not connected.');
        }

        $now = Carbon::now();
        $won = $this->scoped($call)->where('status', CallStatus::Connected->value)->where('claimed_by', $admin->id)->update([
            'status' => CallStatus::Completed->value,
            'end_reason' => CallEndReason::AgentHangup->value,
            'ended_at' => $now,
            'duration_seconds' => $call->connected_at !== null ? (int) round($call->connected_at->diffInSeconds($now)) : null,
            'updated_at' => $now,
        ]) === 1;

        if (! $won) {
            $current = $this->fresh($call);

            return $current !== null && $current->status->isTerminal()
                ? LeadCallActionResult::success($current)
                : $this->refuse($admin, $call, 'hangup', 409, 'call_not_connected', 'This call is not connected.');
        }

        LeadCallBroadcaster::updated($call, CallStatus::Completed);
        // One attempt only: never retry ending a call.
        $api = (new WhatsAppCallingClient($source))->terminate($call->external_call_id);
        $this->log('hangup', $admin, $call, $api->successful ? 'hung_up' : 'hung_up_meta_unconfirmed');

        return LeadCallActionResult::success($this->fresh($call) ?? $call);
    }

    /**
     * @return array{0: LeadCall, 1: LeadSource, 2: null}|array{0: null, 1: null, 2: LeadCallActionResult}
     */
    private function load(Admin $admin, string $callId): array
    {
        $call = LeadCall::query()->find($callId);

        if ($call === null) {
            return [null, null, LeadCallActionResult::notFound()];
        }

        if (! $admin->canUseLeads() || ! $call->isRoutedTo((int) $admin->id)) {
            return [null, null, LeadCallActionResult::error(403, 'forbidden', 'You cannot act on this call.')];
        }

        $source = LeadSource::query()->where('type', LeadSourceType::Whatsapp->value)->find($call->lead_source_id);

        return $source === null ? [null, null, LeadCallActionResult::notFound()] : [$call, $source, null];
    }

    private function repeatClaim(Admin $admin, LeadCall $call, LeadSource $source): LeadCallActionResult
    {
        if ($call->claimed_by !== (int) $admin->id) {
            return $this->refuse($admin, $call, 'claim', 409, 'already_claimed', 'Someone else is already answering this call.');
        }

        if ($call->isExpired()) {
            return $this->refuse($admin, $call, 'claim', 409, 'call_expired', 'This call has expired.');
        }

        $offer = LeadCallSdp::readOffer($source->id, $call->external_call_id);

        if ($offer === null) {
            if ($this->failAnswering($call, $admin, CallEndReason::SdpCacheFailure)) {
                LeadCallBroadcaster::updated($call, CallStatus::Failed);
            }

            return LeadCallActionResult::error(409, 'offer_unavailable', 'This call can no longer be answered.');
        }

        return LeadCallActionResult::success($call, ['sdp_type' => 'offer', 'sdp' => $offer]);
    }

    private function afterLostClaim(Admin $admin, LeadCall $call, LeadSource $source): LeadCallActionResult
    {
        $current = $this->fresh($call);

        return match (true) {
            $current === null => LeadCallActionResult::notFound(),
            $current->status === CallStatus::Answering && $current->claimed_by === (int) $admin->id => $this->repeatClaim($admin, $current, $source),
            $current->status === CallStatus::Answering => $this->refuse($admin, $current, 'claim', 409, 'already_claimed', 'Someone else is already answering this call.'),
            $current->status === CallStatus::Ringing && $current->isExpired() => $this->refuse($admin, $current, 'claim', 409, 'call_expired', 'This call has expired.'),
            default => $this->refuse($admin, $current, 'claim', 409, 'call_not_active', 'This call is no longer ringing.'),
        };
    }

    private function repeatedAnswer(Admin $admin, LeadCall $call, LeadSource $source, string $answer): LeadCallActionResult
    {
        $cached = LeadCallSdp::readAnswer($source->id, $call->external_call_id);

        if ($cached === null || $cached !== $answer) {
            return $this->refuse($admin, $call, 'answer', 409, 'sdp_mismatch', 'Send the same answer as your first attempt.');
        }

        return LeadCallActionResult::success($call);
    }

    private function claimantRefusal(string $action, Admin $admin, LeadCall $call): ?LeadCallActionResult
    {
        return match (true) {
            $call->status === CallStatus::Ringing => $this->refuse($admin, $call, $action, 409, 'call_not_claimed', 'Claim the call before answering it.'),
            $call->status !== CallStatus::Answering => $this->refuse($admin, $call, $action, 409, 'call_not_answerable', 'This call is no longer being answered.'),
            $call->claimed_by !== (int) $admin->id => $this->refuse($admin, $call, $action, 403, 'not_claimant', 'Only the person who picked up this call can answer it.'),
            $call->isExpired() => $this->refuse($admin, $call, $action, 409, 'call_expired', 'This call has expired.'),
            default => null,
        };
    }

    private function alreadyConnected(Admin $admin, LeadCall $call): ?LeadCallActionResult
    {
        if ($call->status !== CallStatus::Connected) {
            return null;
        }

        return $call->claimed_by === (int) $admin->id
            ? LeadCallActionResult::success($call)
            : $this->refuse($admin, $call, 'accept', 403, 'not_claimant', 'Only the person who picked up this call can answer it.');
    }

    private function metaFailure(string $action, Admin $admin, LeadCall $call, LeadSource $source, CallingApiResult $api, CallEndReason $reason): LeadCallActionResult
    {
        if ($api->error !== null && $api->error->retryable()) {
            $this->log($action, $admin, $call, 'meta_retryable', $api);

            return LeadCallActionResult::error(503, 'meta_unavailable', 'WhatsApp did not confirm the request. Try again.', true);
        }

        if (! $this->failAnswering($call, $admin, $reason)) {
            return $this->stateChanged($action, $admin, $call, $source);
        }

        LeadCallSdp::forget($source->id, $call->external_call_id);
        $this->log($action, $admin, $call, 'meta_failed', $api);
        LeadCallBroadcaster::updated($call, CallStatus::Failed);

        return LeadCallActionResult::error(502, 'meta_rejected', 'WhatsApp could not connect this call.');
    }

    private function stateChanged(string $action, Admin $admin, LeadCall $call, LeadSource $source): LeadCallActionResult
    {
        LeadCallSdp::forget($source->id, $call->external_call_id);

        return $this->refuse($admin, $call, $action, 409, 'call_state_changed', 'The call changed while your request was in progress.');
    }

    private function failAnswering(LeadCall $call, Admin $admin, CallEndReason $reason): bool
    {
        return $this->scoped($call)->where('status', CallStatus::Answering->value)->where('claimed_by', $admin->id)
            ->update($this->ended(CallStatus::Failed, $reason)) === 1;
    }

    /**
     * @return array<string, mixed>
     */
    private function ended(CallStatus $status, CallEndReason $reason): array
    {
        return ['status' => $status->value, 'end_reason' => $reason->value, 'ended_at' => Carbon::now(), 'updated_at' => Carbon::now()];
    }

    /**
     * @return Builder<LeadCall>
     */
    private function scoped(LeadCall $call): Builder
    {
        return LeadCall::query()->whereKey($call->id);
    }

    private function fresh(LeadCall $call): ?LeadCall
    {
        return LeadCall::query()->find($call->id);
    }

    /**
     * A short cache lock (never a database lock) so two tabs can't send
     * Meta the same step twice; it expires by itself.
     */
    private function withActionLock(LeadCall $call, Closure $callback): LeadCallActionResult
    {
        try {
            $lock = Cache::lock("wa-call-action:{$call->id}", (int) config('calling.action_lock_seconds'));
            $acquired = $lock->get();
        } catch (Throwable) {
            return LeadCallActionResult::error(503, 'action_lock_unavailable', 'The call could not be processed right now. Try again.', true);
        }

        if (! $acquired) {
            return LeadCallActionResult::error(409, 'action_in_progress', 'Another request for this call is still in progress.', true);
        }

        try {
            return $callback();
        } finally {
            try {
                $lock->release();
            } catch (Throwable) {
                // Expires by itself.
            }
        }
    }

    private function refuse(Admin $admin, LeadCall $call, string $action, int $status, string $code, string $message): LeadCallActionResult
    {
        $this->log($action, $admin, $call, $code);

        return LeadCallActionResult::error($status, $code, $message);
    }

    private function log(string $action, Admin $admin, LeadCall $call, string $outcome, ?CallingApiResult $api = null): void
    {
        Log::info('WA CALL ACTION', [
            'lead_call_id' => $call->id,
            'action' => $action,
            'outcome' => $outcome,
            'admin_id' => $admin->id,
            'meta_category' => $api?->error?->value,
            'meta_code' => $api?->metaCode,
        ]);
    }
}
