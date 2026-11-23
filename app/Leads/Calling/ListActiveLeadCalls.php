<?php

namespace App\Leads\Calling;

use App\Leads\Enums\CallDirection;
use App\Leads\Enums\CallStatus;
use App\Leads\Models\LeadCall;
use App\Leads\Services\LeadPeople;
use App\Models\Admin;
use Illuminate\Support\Carbon;

/**
 * The calls this admin's call box should show: ringing for them, or the one
 * they picked up. Read-only.
 */
class ListActiveLeadCalls
{
    public function __construct(private readonly LeadPeople $people) {}

    /**
     * @return array<int, array<string, mixed>>
     */
    public function handle(Admin $admin): array
    {
        if (! $admin->canUseLeads()) {
            return [];
        }

        $now = Carbon::now();
        $cutoff = $now->copy()->subMinutes((int) config('calling.active_window_minutes'));
        $id = (int) $admin->id;

        $calls = LeadCall::query()
            ->where(function ($q) use ($id, $now, $cutoff): void {
                $q->where(fn ($r) => $r->where('direction', CallDirection::Inbound->value)->where('status', CallStatus::Ringing->value)->where('ringing_expires_at', '>', $now)->whereJsonContains('routed_user_ids', $id))
                    ->orWhere(fn ($o) => $o->where('direction', CallDirection::Outbound->value)->whereIn('status', [CallStatus::Initiated->value, CallStatus::Ringing->value])->where('claimed_by', $id)->where('created_at', '>=', $cutoff))
                    ->orWhere(fn ($a) => $a->where('status', CallStatus::Answering->value)->where('claimed_by', $id)->where('claimed_at', '>=', $cutoff))
                    ->orWhere(fn ($c) => $c->where('status', CallStatus::Connected->value)->where('claimed_by', $id)->where('connected_at', '>=', $cutoff));
            })
            ->with('lead:id,name,phone,identifier')
            ->latest()
            ->limit(20)
            ->get();

        $names = $this->people->namesFor($calls->pluck('assignee_id_at_arrival'));

        return $calls->filter(fn (LeadCall $call): bool => $call->lead !== null)->map(fn (LeadCall $call): array => [
            'id' => $call->id,
            'status' => $call->status->value,
            'direction' => $call->direction->value,
            'claimed_by_me' => $call->claimed_by === $id,
            'lead' => ['id' => $call->lead_id, 'name' => $call->lead?->name, 'phone' => $call->lead?->phone, 'identifier' => $call->lead?->identifier],
            'assignee_name' => $call->assignee_id_at_arrival !== null ? ($names[$call->assignee_id_at_arrival] ?? null) : null,
            'receiving_as' => $call->routing_mode->value,
            'expires_in_seconds' => $call->status === CallStatus::Connected || $call->ringing_expires_at === null ? null : max(0, (int) $now->diffInSeconds($call->ringing_expires_at, false)),
            'connected_at' => $call->connected_at?->toIso8601String(),
        ])->values()->all();
    }
}
