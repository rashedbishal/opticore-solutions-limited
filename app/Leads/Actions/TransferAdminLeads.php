<?php

namespace App\Leads\Actions;

use App\Leads\Events\LeadUpdated;
use App\Leads\Models\Lead;
use App\Leads\Services\LeadAssignmentService;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;

/**
 * Before an admin is deleted: gives every lead they own to the person the
 * mother admin picked, and removes their lead-only records (unowned-lead
 * access, lead alerts, assignment bookkeeping).
 */
class TransferAdminLeads
{
    public function __construct(private readonly LeadAssignmentService $assignment) {}

    public function handle(Admin $from, ?Admin $to, Admin $actor): void
    {
        Lead::query()->where('assigned_to', $from->id)->orderBy('id')->each(function (Lead $lead) use ($to, $actor): void {
            if ($to === null) {
                return;
            }

            $this->assignment->assign($lead, $to, $actor, 'Moved from a deleted admin.');
            LeadUpdated::dispatch($lead->id);
        });

        DB::table('lead_source_unassigned_viewers')->where('admin_id', $from->id)->delete();
        DB::table('lead_agent_states')->where('admin_id', $from->id)->delete();
        $from->notifications()->delete();
    }
}
