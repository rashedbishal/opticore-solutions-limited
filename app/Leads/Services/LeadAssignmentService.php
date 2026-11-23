<?php

namespace App\Leads\Services;

use App\Leads\Enums\AutoDistributionMethod;
use App\Leads\Enums\LeadDistributionMode;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadAssignment;
use App\Leads\Models\LeadSetting;
use App\Leads\Notifications\LeadAssignedNotification;
use App\Models\Admin;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Giving leads to people. Every assignment records a history row and
 * alerts the new owner (after the transaction commits, so the alert can
 * never point at a lead that was rolled back).
 */
class LeadAssignmentService
{
    public function __construct(private readonly LeadPeople $people) {}

    public function assign(Lead $lead, Admin $assignee, ?Admin $assignedBy, ?string $note = null): void
    {
        DB::transaction(function () use ($lead, $assignee, $assignedBy, $note): void {
            $lead->update([
                'assigned_to' => $assignee->id,
                'assigned_at' => now(),
            ]);

            LeadAssignment::create([
                'lead_id' => $lead->id,
                'assigned_to' => $assignee->id,
                'assigned_to_name' => $assignee->name,
                'assigned_by' => $assignedBy?->id,
                'assigned_by_name' => $assignedBy?->name,
                'assignment_note' => $note,
            ]);

            DB::table('lead_agent_states')->upsert(
                [['admin_id' => $assignee->id, 'last_assigned_at' => now()->format('Y-m-d H:i:s.u'), 'created_at' => now(), 'updated_at' => now()]],
                ['admin_id'],
                ['last_assigned_at', 'updated_at'],
            );
        });

        DB::afterCommit(function () use ($lead, $assignee, $assignedBy): void {
            // Assigning a lead to yourself needs no alert.
            if ($assignedBy !== null && (int) $assignedBy->id === (int) $assignee->id) {
                return;
            }

            $assignee->notify(new LeadAssignedNotification($lead->fresh() ?? $lead, $assignedBy?->name));
        });
    }

    public function unassign(Lead $lead): void
    {
        $lead->update(['assigned_to' => null, 'assigned_at' => null]);
    }

    /**
     * Gives an unowned lead to an agent when automatic distribution is on.
     * Only agents take part (managers assign, they don't receive).
     */
    public function autoAssign(Lead $lead): void
    {
        $settings = LeadSetting::current();

        if ($settings->distribution_mode !== LeadDistributionMode::Automatic) {
            return;
        }

        DB::transaction(function () use ($lead, $settings): void {
            $current = Lead::query()->whereKey($lead->id)->lockForUpdate()->first(['id', 'assigned_to']);

            if ($current === null || $current->assigned_to !== null) {
                return;
            }

            // Serialises concurrent auto-assignments so two leads arriving
            // together can't both pick the same "next" agent.
            LeadSetting::query()->lockForUpdate()->first();

            $agents = $this->people->agentsQuery()->get();

            if ($agents->isEmpty()) {
                return;
            }

            $assignee = match ($settings->auto_distribution_method) {
                AutoDistributionMethod::LeastLoaded => $this->leastLoaded($agents),
                AutoDistributionMethod::Random => $agents->random(),
                default => $this->nextInTurn($agents),
            };

            $this->assign($lead, $assignee, null, 'Automatically assigned.');
        }, 3);
    }

    /**
     * Whoever was assigned longest ago (never-assigned first), ties by id.
     *
     * @param  Collection<int, Admin>  $agents
     */
    private function nextInTurn(Collection $agents): Admin
    {
        $lastAssigned = $this->lastAssignedAt($agents);

        return $agents->sortBy(fn (Admin $agent): string => ($lastAssigned[(int) $agent->id] ?? '0000').'|'.str_pad((string) $agent->id, 12, '0', STR_PAD_LEFT))->first();
    }

    /**
     * Fewest open (not closed) leads; ties go to whoever was assigned
     * longest ago.
     *
     * @param  Collection<int, Admin>  $agents
     */
    private function leastLoaded(Collection $agents): Admin
    {
        $openCounts = Lead::query()
            ->whereIn('assigned_to', $agents->pluck('id'))
            ->whereHas('status', fn ($query) => $query->where('is_closed', false))
            ->groupBy('assigned_to')
            ->selectRaw('assigned_to, count(*) as open_count')
            ->pluck('open_count', 'assigned_to');

        $lastAssigned = $this->lastAssignedAt($agents);

        return $agents->sortBy(fn (Admin $agent): string => str_pad((string) ($openCounts[$agent->id] ?? 0), 10, '0', STR_PAD_LEFT).'|'.($lastAssigned[(int) $agent->id] ?? '0000').'|'.str_pad((string) $agent->id, 12, '0', STR_PAD_LEFT))->first();
    }

    /**
     * @param  Collection<int, Admin>  $agents
     * @return array<int, string>
     */
    private function lastAssignedAt(Collection $agents): array
    {
        return DB::table('lead_agent_states')
            ->whereIn('admin_id', $agents->pluck('id'))
            ->whereNotNull('last_assigned_at')
            ->pluck('last_assigned_at', 'admin_id')
            ->mapWithKeys(fn ($at, $id): array => [(int) $id => (string) $at])
            ->all();
    }
}
