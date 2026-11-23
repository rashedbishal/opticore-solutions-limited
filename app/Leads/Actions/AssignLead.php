<?php

namespace App\Leads\Actions;

use App\Leads\Events\LeadUpdated;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadDetailUpdateLog;
use App\Leads\Services\LeadAssignmentService;
use App\Leads\Services\LeadPeople;
use App\Models\Admin;
use Illuminate\Validation\ValidationException;

/**
 * A manager gives a lead to someone with a lead role, or takes it off
 * whoever has it (unowned).
 */
class AssignLead
{
    public function __construct(
        private readonly LeadAssignmentService $assignment,
        private readonly LeadPeople $people,
    ) {}

    public function handle(Lead $lead, ?int $assigneeId, Admin $actor): void
    {
        if ($assigneeId === $lead->assigned_to) {
            return;
        }

        if ($assigneeId === null) {
            $this->assignment->unassign($lead);

            LeadDetailUpdateLog::create([
                'lead_id' => $lead->id,
                'changed_by' => $actor->id,
                'changed_by_name' => $actor->name,
                'changed_fields' => ['assigned_to'],
                'action' => 'unassigned',
            ]);
        } else {
            $assignee = $this->people->findLeadUser($assigneeId);

            if ($assignee === null) {
                throw ValidationException::withMessages(['assigned_to' => 'Please choose someone with lead access.']);
            }

            $this->assignment->assign($lead, $assignee, $actor);
        }

        $lead->refresh();
        LeadUpdated::dispatch($lead->id);
    }
}
