<?php

namespace App\Leads\Actions;

use App\Leads\Events\LeadUpdated;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadDetailUpdateLog;
use App\Leads\Notifications\FollowUpCancelledNotification;
use App\Leads\Notifications\MeetingCancelledNotification;
use App\Leads\Services\LeadAdminNotifier;
use App\Leads\Support\LeadClock;
use App\Models\Admin;

/**
 * "Mark done" / "Cancel" for a lead's meeting or follow-up. Clears the date,
 * keeps a history entry with the old date, and tells the other managers
 * about a cancellation. A date can only be marked done once it has come.
 */
class ResolveLeadDate
{
    public const MEETING = 'meeting';

    public const FOLLOW_UP = 'follow_up';

    public function __construct(private readonly LeadAdminNotifier $notifier) {}

    /**
     * @param  'meeting'|'follow_up'  $kind
     * @param  'done'|'cancelled'  $outcome
     * @return bool whether anything changed
     */
    public function handle(Lead $lead, string $kind, string $outcome, Admin $actor): bool
    {
        $column = $kind === self::MEETING ? 'meeting_date' : 'next_follow_up_at';
        $oldDate = $lead->{$column};

        if ($oldDate === null) {
            return false;
        }

        if ($outcome === 'done' && LeadClock::today()->lt($oldDate)) {
            return false;
        }

        if ($outcome === 'cancelled') {
            $this->notifier->notifyExcept($actor, $kind === self::MEETING
                ? new MeetingCancelledNotification($lead, $actor->name)
                : new FollowUpCancelledNotification($lead, $actor->name));
        }

        $updates = [$column => null];

        if ($kind === self::MEETING) {
            $updates['meeting_time'] = null;
        }

        $lead->update($updates);

        LeadDetailUpdateLog::create([
            'lead_id' => $lead->id,
            'changed_by' => $actor->id,
            'changed_by_name' => $actor->name,
            'changed_fields' => [$column],
            'action' => ($kind === self::MEETING ? 'meeting_' : 'followup_').$outcome,
            'action_date' => $oldDate,
        ]);

        LeadUpdated::dispatch($lead->id);

        return true;
    }
}
