<?php

namespace App\Leads\Calling;

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

        $rules = [
            [CallStatus::Ringing, CallStatus::Missed, CallEndReason::RingTimeout],
            [CallStatus::Answering, CallStatus::Missed, CallEndReason::AnswerTimeout],
            [CallStatus::Connected, CallStatus::Completed, CallEndReason::StaleNoTerminate],
        ];

        foreach ($rules as [$from, $to, $reason]) {
            $calls = $this->stale(LeadCall::query(), $from, $grace, $connected)->limit($limit)->get();

            foreach ($calls as $call) {
                try {
                    $values = ['status' => $to->value, 'end_reason' => $reason->value, 'updated_at' => Carbon::now()];

                    if ($from !== CallStatus::Connected) {
                        $values['ended_at'] = $call->ringing_expires_at;
                    }

                    $won = $this->stale(LeadCall::query()->whereKey($call->id), $from, $grace, $connected)->update($values) === 1;
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
                LeadCallSdp::forget($call->lead_source_id, $call->external_call_id);
                LeadCallBroadcaster::updated($call, $to);
            }
        }

        return $summary;
    }

    /**
     * @param  Builder<LeadCall>  $query
     * @return Builder<LeadCall>
     */
    private function stale(Builder $query, CallStatus $from, Carbon $grace, Carbon $connected): Builder
    {
        $query->where('status', $from->value);

        return match ($from) {
            CallStatus::Ringing => $query->whereNull('claimed_by')->where('ringing_expires_at', '<', $grace),
            CallStatus::Connected => $query->where('connected_at', '<', $connected),
            default => $query->where('ringing_expires_at', '<', $grace),
        };
    }
}
