<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Enums\LeadPriority;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadStatus;
use App\Leads\Services\LeadAccess;
use App\Leads\Services\LeadPeople;
use App\Leads\Support\LeadFilters;
use App\Models\Admin;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * One Facebook Lead Ads source as a spreadsheet: a column per form
 * question, plus Excel export (same as OptiFin's Lead Ads page). Agents
 * only see the rows they're allowed to.
 */
class LeadAdController extends Controller
{
    private const PER_PAGE = 25;

    public function __construct(
        private readonly LeadAccess $access,
        private readonly LeadPeople $people,
    ) {}

    public function show(Request $request, LeadSource $source): Response
    {
        abort_unless($source->type === LeadSourceType::FacebookLeadAds, 404);
        $admin = $this->admin();
        $filters = LeadFilters::fromRequest($request);

        $page = $this->filtered($source, $admin, $filters)->with('status')->latest()->paginate(self::PER_PAGE)->withQueryString();
        $columns = $this->fieldColumns($source, $admin);
        $names = $this->people->namesFor(collect($page->items())->pluck('assigned_to'));

        return Inertia::render('Admin/Leads/AdSourceLeads', [
            'source' => ['id' => $source->id, 'name' => $source->name],
            'columns' => $columns,
            'leads' => [
                'data' => collect($page->items())->map(fn (Lead $lead): array => [
                    'id' => $lead->id,
                    'identifier' => $lead->identifier,
                    'name' => $lead->name,
                    'fields' => $lead->leadAdFieldValues(),
                    'form_name' => $lead->source_data['form_name'] ?? null,
                    'status_id' => $lead->status_id,
                    'assigned_to_name' => $lead->assigned_to !== null ? ($names[$lead->assigned_to] ?? 'Deleted admin') : null,
                    'created_at' => $lead->created_at?->toIso8601String(),
                ])->values(),
                'links' => $page->linkCollection(),
                'total' => $page->total(),
            ],
            'filters' => $filters,
            'statuses' => LeadStatus::query()->orderBy('sort_order')->get(['id', 'name', 'color', 'is_closed']),
            'priorities' => LeadPriority::options(),
            'assignableUsers' => $admin->isLeadManager() ? $this->people->assignableOptions() : [],
        ]);
    }

    public function export(Request $request, LeadSource $source): StreamedResponse
    {
        abort_unless($source->type === LeadSourceType::FacebookLeadAds, 404);
        $admin = $this->admin();
        $columns = $this->fieldColumns($source, $admin);
        $leads = $this->filtered($source, $admin, LeadFilters::fromRequest($request))->with('status')->latest()->get();

        $sheet = (new Spreadsheet)->getActiveSheet();
        $headings = ['Lead ID', 'Name', ...array_map(fn (string $c): string => ucwords(str_replace('_', ' ', $c)), $columns), 'Form', 'Status', 'Submitted At'];
        $sheet->fromArray([$headings]);

        foreach ($leads as $index => $lead) {
            $values = $lead->leadAdFieldValues();
            $row = [
                $lead->identifier,
                $lead->name,
                ...array_map(fn (string $c): ?string => $values[$c] ?? null, $columns),
                $lead->source_data['form_name'] ?? null,
                $lead->status->name,
                $lead->created_at?->toDateTimeString(),
            ];

            // Every cell is written as text, so answers like "=1+1" or long
            // phone numbers stay exactly as the person typed them.
            foreach ($row as $col => $value) {
                $sheet->setCellValueExplicit([$col + 1, $index + 2], (string) ($value ?? ''), DataType::TYPE_STRING);
            }
        }

        $filename = Str::slug($source->name).'-'.now()->format('Y-m-d_His').'.xlsx';
        $spreadsheet = $sheet->getParent();

        return response()->streamDownload(function () use ($spreadsheet): void {
            (new Xlsx($spreadsheet))->save('php://output');
        }, $filename, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    /**
     * Search here matches the lead number only (same as OptiFin).
     *
     * @param  array{search: string, status: string, priority: string, assigned_to: string, from: string, to: string}  $filters
     * @return Builder<Lead>
     */
    private function filtered(LeadSource $source, Admin $admin, array $filters): Builder
    {
        $search = $filters['search'];
        $query = LeadFilters::apply($this->access->visibleLeads($admin)->where('source_id', $source->id), [...$filters, 'search' => ''], $admin->isLeadManager());

        if ($search !== '') {
            $query->whereRaw("LOWER(identifier) LIKE ? ESCAPE '!'", ['%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($search)).'%']);
        }

        return $query;
    }

    /**
     * Every question name seen on this source, in first-seen order.
     *
     * @return array<int, string>
     */
    private function fieldColumns(LeadSource $source, Admin $admin): array
    {
        $names = [];

        foreach ($this->access->visibleLeads($admin)->where('source_id', $source->id)->orderBy('created_at')->get(['id', 'source_data', 'source_id']) as $lead) {
            foreach (array_keys($lead->leadAdFieldValues()) as $name) {
                if (! in_array($name, $names, true)) {
                    $names[] = $name;
                }
            }
        }

        return $names;
    }

    private function admin(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }
}
