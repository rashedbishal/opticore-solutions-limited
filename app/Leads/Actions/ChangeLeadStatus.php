<?php

namespace App\Leads\Actions;

use App\Leads\Enums\LeadPriority;
use App\Leads\Events\LeadUpdated;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadDetailUpdateLog;
use App\Leads\Models\LeadStatus;
use App\Leads\Models\LeadStatusLog;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;

/**
 * Moves a lead to another status and/or changes its priority. Leaving the
 * first column counts as first contact; entering a final status closes the
 * lead (leaving one re-opens it).
 */
class ChangeLeadStatus
{
    /**
     * @return bool whether anything changed
     */
    public function handle(Lead $lead, ?string $statusId, ?LeadPriority $priority, Admin $actor): bool
    {
        $changed = DB::transaction(function () use ($lead, $statusId, $priority, $actor): bool {
            $locked = Lead::query()->whereKey($lead->id)->lockForUpdate()->firstOrFail();
            $oldStatus = LeadStatus::query()->findOrFail($locked->status_id);
            $newStatus = $statusId !== null ? LeadStatus::query()->find($statusId) : $oldStatus;

            if ($newStatus === null) {
                return false;
            }

            $statusChanged = $oldStatus->id !== $newStatus->id;
            $updates = [];

            if ($priority !== null) {
                $updates['priority'] = $priority;
            }

            if ($statusChanged) {
                $updates['status_id'] = $newStatus->id;

                if ($oldStatus->id === LeadStatus::initial()?->id) {
                    $updates['first_contacted_at'] = $locked->first_contacted_at ?? now();
                }

                $updates['closed_at'] = $newStatus->is_closed ? now() : null;
            }

            $locked->fill($updates);
            $dirty = array_keys($locked->getDirty());

            if ($dirty === []) {
                return false;
            }

            $locked->save();

            if ($statusChanged) {
                LeadStatusLog::create([
                    'lead_id' => $locked->id,
                    'changed_by' => $actor->id,
                    'changed_by_name' => $actor->name,
                    'old_status_id' => $oldStatus->id,
                    'new_status_id' => $newStatus->id,
                ]);
            }

            if (in_array('priority', $dirty, true)) {
                LeadDetailUpdateLog::create([
                    'lead_id' => $locked->id,
                    'changed_by' => $actor->id,
                    'changed_by_name' => $actor->name,
                    'changed_fields' => ['priority'],
                ]);
            }

            return true;
        });

        if ($changed) {
            $lead->refresh();
            LeadUpdated::dispatch($lead->id);
        }

        return $changed;
    }
}
