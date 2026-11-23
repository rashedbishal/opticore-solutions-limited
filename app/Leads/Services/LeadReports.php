<?php

namespace App\Leads\Services;

use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadSourceCost;
use App\Leads\Models\LeadStatus;
use App\Leads\Support\LeadClock;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * The numbers on Leads → Reports, live from the database, same as OptiFin:
 * leads added in [from, to) (Bangladesh days), merged leads left out.
 */
class LeadReports
{
    public const int MAX_RANGE_DAYS = 92;

    public function __construct(private readonly LeadPeople $people) {}

    /**
     * @return array<string, mixed>
     */
    public function all(CarbonImmutable $from, CarbonImmutable $to): array
    {
        return [
            'total' => $this->base($from, $to)->count(),
            'daily' => $this->daily($from, $to),
            'statuses' => $this->statuses($from, $to),
            'sources' => $this->sources($from, $to),
            'people' => $this->people($from, $to),
            'first_response' => $this->firstResponse($from, $to),
            'costs' => $this->costs($from, $to),
        ];
    }

    /**
     * @return Builder<Lead>
     */
    private function base(CarbonImmutable $from, CarbonImmutable $to): Builder
    {
        return Lead::query()->where('created_at', '>=', $from->utc())->where('created_at', '<', $to->utc());
    }

    /**
     * @return array<int, array{date: string, count: int}>
     */
    private function daily(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $counts = [];

        foreach ($this->base($from, $to)->toBase()->pluck('created_at') as $createdAt) {
            $day = CarbonImmutable::parse((string) $createdAt, 'UTC')->timezone(LeadClock::TIMEZONE)->toDateString();
            $counts[$day] = ($counts[$day] ?? 0) + 1;
        }

        $days = [];

        for ($day = $from; $day->lt($to); $day = $day->addDay()) {
            $days[] = ['date' => $day->toDateString(), 'count' => $counts[$day->toDateString()] ?? 0];
        }

        return $days;
    }

    /**
     * @return array<int, array{name: string, color: string, count: int}>
     */
    private function statuses(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $counts = $this->base($from, $to)->selectRaw('status_id, count(*) as aggregate')->groupBy('status_id')->toBase()->pluck('aggregate', 'status_id');

        return LeadStatus::query()->orderBy('sort_order')->get()->toBase()
            ->map(fn (LeadStatus $s): array => ['name' => $s->name, 'color' => $s->color, 'count' => (int) ($counts[$s->id] ?? 0)])
            ->values()->all();
    }

    /**
     * @return array<int, array{name: string, count: int}>
     */
    private function sources(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $counts = $this->base($from, $to)->selectRaw('source_id, count(*) as aggregate')->groupBy('source_id')->toBase()->pluck('aggregate', 'source_id');
        $names = LeadSource::query()->whereKey($counts->keys())->pluck('name', 'id');

        return $counts->map(fn ($count, $id): array => ['name' => (string) ($names[$id] ?? 'Deleted source'), 'count' => (int) $count])
            ->sortByDesc('count')->values()->all();
    }

    /**
     * @return array<int, array{name: string, count: int}>
     */
    private function people(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $counts = $this->base($from, $to)->whereNotNull('assigned_to')->selectRaw('assigned_to, count(*) as aggregate')->groupBy('assigned_to')->toBase()->pluck('aggregate', 'assigned_to');
        $names = $this->people->namesFor($counts->keys()->map(fn ($id): int => (int) $id));
        $rows = $counts->map(fn ($count, $id): array => ['name' => $names[(int) $id] ?? 'Deleted admin', 'count' => (int) $count])->values()->all();
        $unassigned = $this->base($from, $to)->whereNull('assigned_to')->count();

        if ($unassigned > 0) {
            $rows[] = ['name' => 'Unassigned', 'count' => $unassigned];
        }

        usort($rows, fn (array $a, array $b): int => $b['count'] <=> $a['count']);

        return $rows;
    }

    /**
     * Hours from a lead arriving to its first reply.
     *
     * @return array{responded: int, average_hours: float|null, median_hours: float|null}
     */
    private function firstResponse(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $hours = $this->base($from, $to)->whereNotNull('first_contacted_at')->toBase()->get(['created_at', 'first_contacted_at'])
            ->map(fn (object $row): float => max(0, (strtotime((string) $row->first_contacted_at) - strtotime((string) $row->created_at)) / 3600))
            ->sort()->values();

        if ($hours->isEmpty()) {
            return ['responded' => 0, 'average_hours' => null, 'median_hours' => null];
        }

        $count = $hours->count();
        $middle = intdiv($count, 2);
        $median = $count % 2 === 0 ? ($hours[$middle - 1] + $hours[$middle]) / 2 : $hours[$middle];

        return ['responded' => $count, 'average_hours' => round((float) $hours->average(), 1), 'median_hours' => round((float) $median, 1)];
    }

    /**
     * Cost per lead for the calendar months fully inside the range (a
     * month's spend can't be split by day). Leads counted per month of
     * the spend.
     *
     * @return array{rows: array<int, array<string, mixed>>, excluded_months: array<int, string>}
     */
    private function costs(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $covered = [];
        $excluded = [];

        for ($month = $from->startOfMonth(); $month->lt($to); $month = $month->addMonthNoOverflow()) {
            if ($month->gte($from) && $month->addMonthNoOverflow()->lte($to)) {
                $covered[] = $month;
            } else {
                $excluded[] = $month->format('F Y');
            }
        }

        if ($covered === []) {
            return ['rows' => [], 'excluded_months' => $excluded];
        }

        $costs = LeadSourceCost::query()->whereIn('month', array_map(fn (CarbonImmutable $m): string => $m->toDateString(), $covered))->with(['source', 'currency'])->get();
        $rows = [];

        foreach ($costs->groupBy('lead_source_id') as $sourceId => $sourceCosts) {
            $first = $sourceCosts->firstOrFail();
            $total = (float) $sourceCosts->sum(fn (LeadSourceCost $c): float => (float) $c->amount);
            $leads = Lead::query()->where('source_id', $sourceId)->where(function (Builder $q) use ($sourceCosts): void {
                foreach ($sourceCosts as $cost) {
                    $start = CarbonImmutable::parse($cost->month->toDateString(), LeadClock::TIMEZONE);
                    $q->orWhere(fn (Builder $w) => $w->where('created_at', '>=', $start->utc())->where('created_at', '<', $start->addMonthNoOverflow()->utc()));
                }
            })->count();

            $rows[] = [
                'source' => $first->source->name,
                'currency' => $first->currency->code,
                'total' => round($total, 2),
                'leads' => $leads,
                'cost_per_lead' => $leads > 0 ? round($total / $leads, 2) : null,
            ];
        }

        usort($rows, fn (array $a, array $b): int => $b['total'] <=> $a['total']);

        return ['rows' => $rows, 'excluded_months' => $excluded];
    }
}
