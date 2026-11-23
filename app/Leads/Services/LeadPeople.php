<?php

namespace App\Leads\Services;

use App\Leads\Enums\LeadRole;
use App\Models\Admin;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Who is who in Lead Management. Admins live on the separate `admin`
 * connection, so these are separate queries rather than joins.
 */
class LeadPeople
{
    /**
     * Everyone with a lead role: the mother admin, managers and agents.
     *
     * @return Builder<Admin>
     */
    public function leadUsersQuery(): Builder
    {
        return Admin::query()->where(function (Builder $query): void {
            $query->where('is_super_admin', true)->orWhereNotNull('lead_role');
        });
    }

    /**
     * The mother admin plus every manager.
     *
     * @return Collection<int, Admin>
     */
    public function managers(): Collection
    {
        return Admin::query()
            ->where(function (Builder $query): void {
                $query->where('is_super_admin', true)->orWhere('lead_role', LeadRole::Manager->value);
            })
            ->get();
    }

    /**
     * @return Builder<Admin>
     */
    public function agentsQuery(): Builder
    {
        return Admin::query()->where('is_super_admin', false)->where('lead_role', LeadRole::Agent->value);
    }

    /**
     * Everyone a lead can be assigned to, for dropdowns.
     *
     * @return array<int, array{id: int, name: string}>
     */
    public function assignableOptions(): array
    {
        return $this->leadUsersQuery()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Admin $admin): array => ['id' => (int) $admin->id, 'name' => $admin->name])
            ->all();
    }

    public function findLeadUser(int $id): ?Admin
    {
        return $this->leadUsersQuery()->whereKey($id)->first();
    }

    /**
     * @param  iterable<int|null>  $ids
     * @return array<int, string>
     */
    public function namesFor(iterable $ids): array
    {
        $ids = collect($ids)->filter()->unique()->values();

        if ($ids->isEmpty()) {
            return [];
        }

        return Admin::query()->whereKey($ids->all())->pluck('name', 'id')->mapWithKeys(fn ($name, $id) => [(int) $id => $name])->all();
    }
}
