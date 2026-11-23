<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Models\Currency;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadSourceCost;
use App\Leads\Services\LeadReports;
use App\Leads\Support\LeadClock;
use App\Models\Admin;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Leads → Reports (managers and the mother admin), plus the monthly
 * spend per source behind "cost per lead".
 */
class ReportController extends Controller
{
    public function index(Request $request, LeadReports $reports): Response
    {
        $this->manager();
        [$from, $to, $rangeError] = $this->range($request);

        return Inertia::render('Admin/Leads/Reports', [
            'from' => $from->toDateString(),
            'to' => $to->subDay()->toDateString(),
            'rangeError' => $rangeError,
            'report' => $reports->all($from, $to),
            'spend' => LeadSourceCost::query()->with(['source', 'currency'])->orderByDesc('month')->limit(24)->get()->toBase()->map(fn (LeadSourceCost $c): array => [
                'id' => $c->id,
                'source' => $c->source->name,
                'month' => $c->month->format('F Y'),
                'amount' => $c->amount,
                'currency' => $c->currency->code,
                'recorded_by_name' => $c->getAttribute('recorded_by_name'),
            ]),
            'sources' => LeadSource::query()->orderBy('name')->get(['id', 'name']),
            'currencies' => Currency::query()->orderBy('code')->get(['id', 'code']),
        ]);
    }

    /**
     * One currency per source: a source's later months must use the same
     * currency as its first (same as OptiFin).
     */
    public function storeCost(Request $request): RedirectResponse
    {
        $admin = $this->manager();

        $validated = $request->validate([
            'lead_source_id' => ['required', 'string', Rule::exists('lead_sources', 'id')],
            'month' => ['required', 'date_format:Y-m'],
            'amount' => ['required', 'numeric', 'min:0', 'max:999999999999.99', 'regex:/^\d{1,12}(\.\d{1,2})?$/'],
            'currency_id' => ['required', 'string', Rule::exists('currencies', 'id')],
        ], ['amount.regex' => 'Enter a plain amount with up to 2 decimal places.']);

        $month = CarbonImmutable::createFromFormat('Y-m', $validated['month'], LeadClock::TIMEZONE)?->startOfMonth()->toDateString();

        DB::transaction(function () use ($validated, $month, $admin): void {
            LeadSource::query()->whereKey($validated['lead_source_id'])->lockForUpdate()->firstOrFail();

            $other = LeadSourceCost::query()->where('lead_source_id', $validated['lead_source_id'])->where('month', '!=', $month)->value('currency_id');

            if ($other !== null && $other !== $validated['currency_id']) {
                throw ValidationException::withMessages(['currency_id' => 'This source is already tracked in a different currency. Every month for one source must use the same currency.']);
            }

            LeadSourceCost::query()->updateOrCreate(
                ['lead_source_id' => $validated['lead_source_id'], 'month' => $month],
                ['amount' => $validated['amount'], 'currency_id' => $validated['currency_id'], 'recorded_by' => $admin->id, 'recorded_by_name' => $admin->name],
            );
        });

        return back()->with('success', 'Spend saved.');
    }

    public function destroyCost(LeadSourceCost $cost): RedirectResponse
    {
        $this->manager();
        $cost->delete();

        return back()->with('success', 'Spend deleted.');
    }

    /**
     * Bangladesh-time dates; default is the last 30 days; at most 92 days.
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable, 2: string|null}
     */
    private function range(Request $request): array
    {
        $today = CarbonImmutable::parse(LeadClock::todayString(), LeadClock::TIMEZONE);
        $defaultFrom = $today->subDays(29);

        try {
            $from = $request->filled('from') ? CarbonImmutable::createFromFormat('Y-m-d', (string) $request->query('from'), LeadClock::TIMEZONE)?->startOfDay() : null;
            $to = $request->filled('to') ? CarbonImmutable::createFromFormat('Y-m-d', (string) $request->query('to'), LeadClock::TIMEZONE)?->startOfDay()->addDay() : null;
        } catch (Throwable) {
            $from = $to = null;
        }

        $from ??= $defaultFrom;
        $to ??= $today->addDay();

        if ($from->gte($to) || $from->diffInDays($to) > LeadReports::MAX_RANGE_DAYS) {
            return [$defaultFrom, $today->addDay(), 'Pick a range of up to '.LeadReports::MAX_RANGE_DAYS.' days, with "from" before "to". Showing the last 30 days.'];
        }

        return [$from, $to, null];
    }

    private function manager(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->isLeadManager(), 403);

        return $admin;
    }
}
