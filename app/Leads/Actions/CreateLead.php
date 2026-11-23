<?php

namespace App\Leads\Actions;

use App\Leads\Enums\LeadSourceType;
use App\Leads\Events\LeadUpdated;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadStatus;
use App\Leads\Notifications\FollowUpUpdatedNotification;
use App\Leads\Notifications\MeetingUpdatedNotification;
use App\Leads\Services\LeadAdminNotifier;
use App\Leads\Services\LeadAssignmentService;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;

/**
 * A lead added by hand from the CMS. A manager may pick the owner; a lead
 * an agent adds is always theirs. Unowned leads still go through automatic
 * distribution when it is switched on.
 */
class CreateLead
{
    public function __construct(
        private readonly LeadAssignmentService $assignment,
        private readonly LeadAdminNotifier $notifier,
    ) {}

    /**
     * @param  array<string, mixed>  $data  validated lead columns
     */
    public function handle(array $data, Admin $createdBy, ?Admin $assignee): Lead
    {
        $lead = DB::transaction(function () use ($data, $createdBy, $assignee): Lead {
            $statusId = LeadStatus::query()->whereKey($data['status_id'] ?? null)->exists()
                ? $data['status_id']
                : LeadStatus::initial()?->id;

            $lead = Lead::create([
                ...$data,
                'source_id' => LeadSource::ofType(LeadSourceType::Manual)->id,
                'status_id' => $statusId,
            ]);

            if ($assignee !== null) {
                $this->assignment->assign($lead, $assignee, $createdBy);
            } else {
                $this->assignment->autoAssign($lead);
            }

            return $lead;
        });

        $lead->refresh();

        // A new lead's meeting/follow-up is always a fresh schedule.
        if ($lead->meeting_date !== null) {
            $this->notifier->notifyExcept($createdBy, new MeetingUpdatedNotification($lead, $createdBy->name, rescheduled: false));
        }

        if ($lead->next_follow_up_at !== null) {
            $this->notifier->notifyExcept($createdBy, new FollowUpUpdatedNotification($lead, $createdBy->name, rescheduled: false));
        }

        LeadUpdated::dispatch($lead->id);

        return $lead;
    }
}
