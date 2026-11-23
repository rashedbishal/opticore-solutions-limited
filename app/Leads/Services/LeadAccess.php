<?php

namespace App\Leads\Services;

use App\Leads\Models\Lead;
use App\Models\Admin;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * The single place that decides what an admin may see and do with leads.
 * Managers (and the mother admin) see every lead; an agent sees the leads
 * assigned to them, plus unowned leads from the sources the mother admin
 * opened to them.
 */
class LeadAccess
{
    /**
     * @return Builder<Lead>
     */
    public function visibleLeads(Admin $admin): Builder
    {
        $query = Lead::query();

        if ($admin->isLeadManager()) {
            return $query;
        }

        if (! $admin->isLeadAgent()) {
            return $query->whereRaw('1 = 0');
        }

        $sourceIds = $this->unassignedSourceIds($admin);

        return $query->where(function (Builder $scoped) use ($admin, $sourceIds): void {
            $scoped->where('assigned_to', $admin->id);

            if ($sourceIds !== []) {
                $scoped->orWhere(fn (Builder $q) => $q->whereNull('assigned_to')->whereIn('source_id', $sourceIds));
            }
        });
    }

    public function canView(Admin $admin, Lead $lead): bool
    {
        if ($admin->isLeadManager()) {
            return true;
        }

        if (! $admin->isLeadAgent()) {
            return false;
        }

        if ($lead->assigned_to === (int) $admin->id) {
            return true;
        }

        return $lead->assigned_to === null && in_array($lead->source_id, $this->unassignedSourceIds($admin), true);
    }

    /** Agents may work any lead they can see; managers may work every lead. */
    public function canUpdate(Admin $admin, Lead $lead): bool
    {
        return $this->canView($admin, $lead);
    }

    public function canCreate(Admin $admin): bool
    {
        return $admin->canUseLeads();
    }

    public function canAssign(Admin $admin): bool
    {
        return $admin->isLeadManager();
    }

    public function canDelete(Admin $admin): bool
    {
        return $admin->isLeadManager();
    }

    /**
     * Sources whose unowned leads this agent may see.
     *
     * @return array<int, string>
     */
    public function unassignedSourceIds(Admin $admin): array
    {
        return DB::table('lead_source_unassigned_viewers')
            ->where('admin_id', $admin->id)
            ->pluck('lead_source_id')
            ->map(fn ($id): string => (string) $id)
            ->all();
    }
}
