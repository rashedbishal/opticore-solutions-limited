<?php

namespace App\Leads\Support;

use App\Leads\Enums\LeadPriority;
use App\Leads\Models\Lead;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * The lead list/board filters (same meaning as OptiFin): status, priority,
 * owner (managers only), created-date range in Bangladesh time, and a
 * search over number, name, phone, email and company (managers also
 * search location, win % and deal value).
 */
final class LeadFilters
{
    /**
     * @return array{search: string, status: string, priority: string, assigned_to: string, from: string, to: string}
     */
    public static function fromRequest(Request $request): array
    {
        return [
            'search' => trim((string) $request->query('search', '')),
            'status' => (string) $request->query('status', ''),
            'priority' => (string) $request->query('priority', ''),
            'assigned_to' => (string) $request->query('assigned_to', ''),
            'from' => (string) $request->query('from', ''),
            'to' => (string) $request->query('to', ''),
        ];
    }

    /**
     * @param  Builder<Lead>  $query
     * @param  array{search: string, status: string, priority: string, assigned_to: string, from: string, to: string}  $filters
     * @return Builder<Lead>
     */
    public static function apply(Builder $query, array $filters, bool $isManager): Builder
    {
        if ($filters['status'] !== '') {
            $query->where('status_id', $filters['status']);
        }

        if (($priority = LeadPriority::tryFrom($filters['priority'])) !== null) {
            $query->where('priority', $priority->value);
        }

        if ($isManager && $filters['assigned_to'] !== '') {
            $filters['assigned_to'] === 'unassigned'
                ? $query->whereNull('assigned_to')
                : $query->where('assigned_to', (int) $filters['assigned_to']);
        }

        if (self::isDate($filters['from'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['from'], LeadClock::TIMEZONE)->startOfDay()->utc());
        }

        if (self::isDate($filters['to'])) {
            $query->where('created_at', '<', Carbon::parse($filters['to'], LeadClock::TIMEZONE)->addDay()->startOfDay()->utc());
        }

        if ($filters['search'] !== '') {
            $term = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($filters['search'])).'%';
            $columns = ['identifier', 'name', 'phone', 'email', 'company'];
            $managerColumns = ['location', 'CAST(win_probability AS TEXT)', 'CAST(deal_value AS TEXT)'];

            $query->where(function (Builder $q) use ($term, $columns, $managerColumns, $isManager): void {
                foreach ([...$columns, ...($isManager ? $managerColumns : [])] as $column) {
                    $q->orWhereRaw("LOWER({$column}) LIKE ? ESCAPE '!'", [$term]);
                }
            });
        }

        return $query;
    }

    private static function isDate(string $value): bool
    {
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1;
    }
}
