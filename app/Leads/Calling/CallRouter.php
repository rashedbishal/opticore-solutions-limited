<?php

namespace App\Leads\Calling;

use App\Leads\Enums\CallRoutingMode;
use App\Leads\Enums\CallStatus;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadCall;
use App\Leads\Services\LeadPeople;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;

/**
 * Who rings for an incoming call, decided once (same tiers as OptiFin):
 * 1. the lead's person, if their call box is open and they're not on a call;
 * 2. else every free backup receiver, all at once;
 * 3. else every manager (and the mother admin), plus — for an unowned
 *    lead — agents allowed to see that source's unowned leads.
 * A lead created by this very call skips straight to step 3.
 */
class CallRouter
{
    public function __construct(
        private readonly LeadPeople $people,
        private readonly SoftphonePresence $presence,
    ) {}

    /**
     * @return array{routing_mode: CallRoutingMode, routed_user_ids: array<int, int>, assignee_id_at_arrival: int|null}
     */
    public function route(Lead $lead, bool $createdByThisCall): array
    {
        $assigneeId = $lead->assigned_to;

        if (! $createdByThisCall && $assigneeId !== null) {
            $assignee = $this->people->findLeadUser($assigneeId);

            if ($assignee !== null && ! $this->isBusy([(int) $assignee->id]) && $this->presence->isAvailable($assignee)) {
                return ['routing_mode' => CallRoutingMode::Assignee, 'routed_user_ids' => [(int) $assignee->id], 'assignee_id_at_arrival' => $assigneeId];
            }

            $backups = $this->people->leadUsersQuery()
                ->where('is_whatsapp_backup_receiver', true)
                ->whereKeyNot($assigneeId)
                ->pluck('id')
                ->map(fn ($id): int => (int) $id)
                ->all();
            $free = array_values(array_diff($backups, $this->isBusy($backups)));

            if ($free !== []) {
                sort($free);

                return ['routing_mode' => CallRoutingMode::BackupFallback, 'routed_user_ids' => $free, 'assignee_id_at_arrival' => $assigneeId];
            }
        }

        $ids = $this->people->managers()->map(fn (Admin $a): int => (int) $a->id)->all();

        if ($lead->assigned_to === null) {
            $viewers = DB::table('lead_source_unassigned_viewers')->where('lead_source_id', $lead->source_id)->pluck('admin_id')->map(fn ($id): int => (int) $id)->all();
            $agents = $viewers === [] ? [] : $this->people->agentsQuery()->whereKey($viewers)->pluck('id')->map(fn ($id): int => (int) $id)->all();
            $ids = [...$ids, ...array_diff($agents, $this->isBusy($agents))];
        }

        $ids = array_values(array_unique($ids));
        sort($ids);

        return [
            'routing_mode' => $ids === [] ? CallRoutingMode::None : CallRoutingMode::ManagerFallback,
            'routed_user_ids' => $ids,
            'assignee_id_at_arrival' => $assigneeId,
        ];
    }

    /**
     * Of these admins, the ones already answering or on a call.
     *
     * @param  array<int, int>  $ids
     * @return array<int, int>
     */
    private function isBusy(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return LeadCall::query()
            ->whereIn('claimed_by', $ids)
            ->whereIn('status', [CallStatus::Answering, CallStatus::Connected])
            ->pluck('claimed_by')
            ->map(fn ($id): int => (int) $id)
            ->unique()
            ->values()
            ->all();
    }
}
