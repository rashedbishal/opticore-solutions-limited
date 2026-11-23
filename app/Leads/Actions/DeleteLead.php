<?php

namespace App\Leads\Actions;

use App\Leads\Events\LeadUpdated;
use App\Leads\Exceptions\LeadHasActiveCallException;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadDeletionAudit;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;

/**
 * Permanently deletes a lead (its notes and history go with it) and keeps a
 * deletion record of who deleted what, and when.
 */
class DeleteLead
{
    public function handle(Lead $lead, Admin $actor, bool $isBulk = false): void
    {
        DB::transaction(function () use ($lead, $actor, $isBulk): void {
            $locked = Lead::query()->whereKey($lead->id)->lockForUpdate()->with('source')->first();

            if ($locked === null) {
                return;
            }

            if ($locked->hasActiveCall()) {
                throw new LeadHasActiveCallException('This lead is on a WhatsApp call right now. Try again when the call ends.');
            }

            LeadDeletionAudit::create([
                'lead_id' => $locked->id,
                'lead_identifier' => $locked->identifier,
                'lead_name' => $locked->name,
                'lead_email' => $locked->email,
                'lead_phone' => $locked->phone,
                'source_type' => $locked->source->type->value,
                'deleted_by' => $actor->id,
                'deleted_by_name' => $actor->name,
                'is_bulk' => $isBulk,
                'cascade_summary' => [
                    'notes' => $locked->notes()->count(),
                    'status_logs' => $locked->statusLogs()->count(),
                    'assignments' => $locked->assignments()->count(),
                    'detail_update_logs' => $locked->detailUpdateLogs()->count(),
                ],
            ]);

            // Consent records outlive the lead (GDPR proof): keep who it was.
            foreach (['lead_consents', 'lead_consent_events'] as $table) {
                DB::table($table)->where('lead_id', $locked->id)->update(['lead_identifier' => $locked->identifier, 'lead_name' => $locked->name]);
            }

            $locked->delete();
        });

        LeadUpdated::dispatch($lead->id);
    }
}
