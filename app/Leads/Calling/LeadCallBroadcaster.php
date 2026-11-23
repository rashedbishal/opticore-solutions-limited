<?php

namespace App\Leads\Calling;

use App\Leads\Enums\CallDirection;
use App\Leads\Enums\CallStatus;
use App\Leads\Events\LeadCallUpdated;
use App\Leads\Events\LeadUpdated;
use App\Leads\Jobs\SendCallPush;
use App\Leads\Jobs\SendMissedCallNotification;
use App\Leads\Models\LeadCall;
use Throwable;

/**
 * Tells the ringing people's call boxes (and open lead pages) that a call
 * changed, and queues the missed-call alert when a call ends Missed. A
 * broadcast failure never breaks the call itself.
 */
final class LeadCallBroadcaster
{
    public static function updated(LeadCall $call, CallStatus $status): void
    {
        $recipients = array_values(array_map('intval', $call->routed_user_ids ?? []));

        try {
            if ($recipients !== []) {
                event(new LeadCallUpdated($call->id, $status->value, $recipients));
            }

            LeadUpdated::dispatch($call->lead_id);
        } catch (Throwable $e) {
            report($e);
        }

        if ($status === CallStatus::Missed) {
            self::missed($call);
        }

        self::push($call, $status);
    }

    /** Ring (or stop ringing) the devices of people who turned on call alerts. */
    private static function push(LeadCall $call, CallStatus $status): void
    {
        if ($call->direction !== CallDirection::Inbound || ! in_array($status, [CallStatus::Ringing, CallStatus::Answering, CallStatus::Completed, CallStatus::Missed, CallStatus::Rejected, CallStatus::Failed], true)) {
            return;
        }

        try {
            SendCallPush::dispatch($call->id, $status !== CallStatus::Ringing);
        } catch (Throwable $e) {
            report($e);
        }
    }

    public static function missed(LeadCall $call): void
    {
        try {
            SendMissedCallNotification::dispatch($call->id);
        } catch (Throwable $e) {
            report($e);
        }
    }
}
