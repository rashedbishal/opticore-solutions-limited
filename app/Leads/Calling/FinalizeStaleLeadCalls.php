<?php

namespace App\Leads\Calling;

use App\Leads\Enums\CallDirection;
use App\Leads\Enums\CallEndReason;
use App\Leads\Enums\CallStatus;
use App\Leads\Models\LeadCall;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Throwable;

/**
 * Ends calls Meta never closed (its "terminate" never arrived), as OptiFin
 * does: ringing → Missed, answering → Missed, connected for too long →
 * Completed. Each is one conditional update, so it can't race a real
 * answer or Meta's own late terminate.
 */
class FinalizeStaleLeadCalls
{
    /**
     * @return array<string, int>
     */
    public function handle(): array
    {
        $now = Carbon::now();
        $grace = $now->copy()->subSeconds(max(0, (int) config('calling.stale_grace_seconds')));
        $connected = $now->copy()->subMinutes((int) config('calling.active_window_minutes'));
        $limit = max(1, (int) config('calling.reconcile_batch_limit'));
        $summary = ['ended' => 0, 'lost_race' => 0];

        $initiate = $now->copy()->subSeconds(max(0, (int) config('calling.outbound_initiate_grace_seconds')));
        $rules = [
            [CallStatus::Ringing, CallDirection::Inbound, CallStatus::Missed, CallEndReason::RingTimeout],
            [CallStatus::Ringing, CallDirection::Outbound, CallStatus::Failed, CallEndReason::ConsumerNoAnswerOutbound],
            [CallStatus::Answering, CallDirection::Inbound, CallStatus::Missed, CallEndReason::AnswerTimeout],
            [CallStatus::Answering, CallDirection::Outbound, CallStatus::Failed, CallEndReason::OutboundConnectFailed],
            [CallStatus::Connected, null, CallStatus::Completed, CallEndReason::StaleNoTerminate],
            [CallStatus::Initiated, null, CallStatus::Failed, CallEndReason::OutboundConnectFailed],
        ];

        foreach ($rules as [$from, $direction, $to, $reason]) {
            $calls = $this->stale(LeadCall::query(), $from, $direction, $grace, $connected, $initiate)->limit($limit)->get();

            foreach ($calls as $call) {
                try {
                    $values = ['status' => $to->value, 'end_reason' => $reason->value, 'updated_at' => Carbon::now()];

                    $values['ended_at'] = in_array($from, [CallStatus::Ringing, CallStatus::Answering], true) ? $call->ringing_expires_at : Carbon::now();

                    $won = $this->stale(LeadCall::query()->whereKey($call->id), $from, $direction, $grace, $connected, $initiate)->update($values) === 1;
                } catch (Throwable $e) {
                    report($e);

                    continue;
                }

                if (! $won) {
                    $summary['lost_race']++;

                    continue;
                }

                $summary['ended']++;
                $call->forceFill(['status' => $to, 'end_reason' => $reason]);
                if ($call->external_call_id !== null) {
                    LeadCallSdp::forget($call->lead_source_id, $call->external_call_id);
                }
                LeadCallBroadcaster::updated($call, $to);
            }
        }

        return $summary;
    }

    /**
     * @param  Builder<LeadCall>  $query
     * @return Builder<LeadCall>
     */
    private function stale(Builder $query, CallStatus $from, ?CallDirection $direction, Carbon $grace, Carbon $connected, Carbon $initiate): Builder
    {
        $query->where('status', $from->value);

        if ($direction !== null) {
            $query->where('direction', $direction->value);
        }

        return match ($from) {
            CallStatus::Ringing => ($direction === CallDirection::Inbound ? $query->whereNull('claimed_by') : $query)->where('ringing_expires_at', '<', $grace),
            CallStatus::Connected => $query->where('connected_at', '<', $connected),
            CallStatus::Initiated => $query->where('created_at', '<', $initiate),
            default => $query->where('ringing_expires_at', '<', $grace),
        };
    }
}
