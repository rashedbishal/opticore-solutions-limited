<?php

namespace App\Leads\Actions;

use App\Leads\Events\LeadUpdated;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadDetailUpdateLog;
use App\Leads\Notifications\FollowUpUpdatedNotification;
use App\Leads\Notifications\MeetingUpdatedNotification;
use App\Leads\Services\LeadAdminNotifier;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;

/**
 * Saves edits to a lead's contact, company or deal details, records which
 * fields changed, and tells the other managers when a meeting or follow-up
 * was newly scheduled or moved.
 */
class UpdateLeadDetails
{
    public function __construct(private readonly LeadAdminNotifier $notifier) {}

    /**
     * @param  array<string, mixed>  $columns
     * @return array<int, string> the fields that actually changed
     */
    public function handle(Lead $lead, array $columns, Admin $actor): array
    {
        $oldMeeting = $lead->meeting_date?->toDateString();
        $oldFollowUp = $lead->next_follow_up_at?->toDateString();

        $lead->fill($columns);
        $changed = array_keys($lead->getDirty());

        if ($changed === []) {
            return [];
        }

        DB::transaction(function () use ($lead, $changed, $actor): void {
            $lead->save();

            LeadDetailUpdateLog::create([
                'lead_id' => $lead->id,
                'changed_by' => $actor->id,
                'changed_by_name' => $actor->name,
                'changed_fields' => $changed,
            ]);
        });

        $lead->refresh();

        $newMeeting = $lead->meeting_date?->toDateString();

        if ($newMeeting !== null && $newMeeting !== $oldMeeting) {
            $this->notifier->notifyExcept($actor, new MeetingUpdatedNotification($lead, $actor->name, rescheduled: $oldMeeting !== null));
        }

        $newFollowUp = $lead->next_follow_up_at?->toDateString();

        if ($newFollowUp !== null && $newFollowUp !== $oldFollowUp) {
            $this->notifier->notifyExcept($actor, new FollowUpUpdatedNotification($lead, $actor->name, rescheduled: $oldFollowUp !== null));
        }

        LeadUpdated::dispatch($lead->id);

        return $changed;
    }
}
