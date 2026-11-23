<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Actions\AddLeadNote;
use App\Leads\Actions\AssignLead;
use App\Leads\Actions\ChangeLeadStatus;
use App\Leads\Actions\CreateLead;
use App\Leads\Actions\DeleteLead;
use App\Leads\Actions\ResolveLeadDate;
use App\Leads\Actions\UpdateLeadDetails;
use App\Leads\Enums\LeadPriority;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Currency;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadStatus;
use App\Leads\Models\LeadTag;
use App\Leads\Services\LeadAccess;
use App\Leads\Services\LeadPeople;
use App\Leads\Support\LeadFilters;
use App\Leads\Support\LeadPresenter;
use App\Leads\Support\LeadRules;
use App\Models\Admin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Leads → All Leads. Managers (and the mother admin) get the table, agents
 * get the Kanban board; both open a lead in a side panel (?lead=ID) or on
 * its own page. Every action checks LeadAccess on the server.
 */
class LeadController extends Controller
{
    private const PER_PAGE = 15;

    public function __construct(
        private readonly LeadAccess $access,
        private readonly LeadPeople $people,
        private readonly LeadPresenter $presenter,
    ) {}

    public function index(Request $request): Response
    {
        $admin = $this->admin();
        $isManager = $admin->isLeadManager();
        $filters = LeadFilters::fromRequest($request);
        $query = LeadFilters::apply($this->access->visibleLeads($admin), $filters, $isManager)->with(['source', 'tags']);

        $shared = [
            'filters' => $filters,
            'statuses' => LeadStatus::query()->orderBy('sort_order')->get(['id', 'name', 'color', 'is_closed']),
            'priorities' => LeadPriority::options(),
            'currencies' => Currency::query()->orderBy('code')->get(['id', 'code', 'name']),
            'assignableUsers' => $isManager ? $this->people->assignableOptions() : [],
            'can' => ['create' => $this->access->canCreate($admin), 'assign' => $isManager, 'export' => $isManager],
            'selectedLead' => fn () => $this->selectedLead($request, $admin),
        ];

        if ($isManager) {
            // Lead Ads leads are grouped into one "View all" row per Lead Ads
            // source, which opens that source's spreadsheet page.
            $adSources = LeadSource::query()
                ->where('type', LeadSourceType::FacebookLeadAds)
                ->withCount('leads')
                ->withMax('leads', 'created_at')
                ->orderBy('name')
                ->get()
                ->toBase()
                ->map(fn (LeadSource $source): array => [
                    'id' => $source->id,
                    'name' => $source->name,
                    'leads_count' => (int) $source->getAttribute('leads_count'),
                    'latest_at' => $source->getAttribute('leads_max_created_at'),
                ]);

            $page = $query
                ->whereHas('source', fn ($q) => $q->where('type', '!=', LeadSourceType::FacebookLeadAds))
                ->latest()
                ->paginate(self::PER_PAGE)
                ->withQueryString();

            return Inertia::render('Admin/Leads/Index', [
                ...$shared,
                'leads' => [
                    'data' => $this->presenter->rows(collect($page->items())),
                    'links' => $page->linkCollection(),
                    'total' => $page->total(),
                ],
                'adSources' => $adSources,
                'allTags' => LeadTag::query()->orderBy('name')->get(['id', 'name', 'color']),
            ]);
        }

        return Inertia::render('Admin/Leads/Board', [
            ...$shared,
            'leads' => $this->presenter->rows($query->latest()->get()),
        ]);
    }

    /**
     * A merged-away lead's old link opens the lead it was merged into.
     */
    public function show(string $lead): Response|RedirectResponse
    {
        $found = Lead::query()->withMerged()->findOrFail($lead);

        if ($found->isMerged()) {
            return redirect()->route('admin.leads.show', $found->latestVersion())
                ->with('success', "{$found->identifier} was merged into this lead.");
        }

        $lead = $found;
        $admin = $this->admin();
        abort_unless($this->access->canView($admin, $lead), 403);

        $lead->markUpdateSeen();

        return Inertia::render('Admin/Leads/Show', [
            'lead' => $this->presenter->detail($lead, $admin),
            'statuses' => LeadStatus::query()->orderBy('sort_order')->get(['id', 'name', 'color', 'is_closed']),
            'priorities' => LeadPriority::options(),
            'currencies' => Currency::query()->orderBy('code')->get(['id', 'code', 'name']),
            'assignableUsers' => $admin->isLeadManager() ? $this->people->assignableOptions() : [],
        ]);
    }

    public function store(Request $request, CreateLead $createLead): RedirectResponse
    {
        $admin = $this->admin();
        abort_unless($this->access->canCreate($admin), 403);

        $validated = $request->validate(LeadRules::create(), LeadRules::messages());

        $assignee = null;

        if ($admin->isLeadManager()) {
            if (! empty($validated['assigned_to'])) {
                $assignee = $this->people->findLeadUser((int) $validated['assigned_to'])
                    ?? throw ValidationException::withMessages(['assigned_to' => 'Please choose someone with lead access.']);
            }
        } else {
            // A lead an agent adds is always theirs.
            $assignee = $admin;
        }

        $createLead->handle([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'],
            'message' => ($validated['message'] ?? null) ?: null,
            'company' => ($validated['company'] ?? null) ?: null,
            'website' => ($validated['website'] ?? null) ?: null,
            'industry' => ($validated['industry'] ?? null) ?: null,
            'location' => ($validated['location'] ?? null) ?: null,
            'status_id' => $validated['status_id'],
            'priority' => LeadPriority::from($validated['priority']),
            ...LeadRules::dealColumns($validated, includeLeadSourceText: true),
        ], $admin, $assignee);

        return back()->with('success', 'Lead created.');
    }

    public function updateStatus(Request $request, Lead $lead, ChangeLeadStatus $changeStatus): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);

        $validated = $request->validate([
            'status_id' => ['nullable', 'string', Rule::exists('lead_statuses', 'id')],
            'priority' => ['nullable', Rule::enum(LeadPriority::class)],
        ]);

        $changed = $changeStatus->handle(
            $lead,
            $validated['status_id'] ?? null,
            isset($validated['priority']) ? LeadPriority::from($validated['priority']) : null,
            $admin,
        );

        return $changed ? back()->with('success', 'Lead updated.') : back();
    }

    public function updateContact(Request $request, Lead $lead, UpdateLeadDetails $update): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        $validated = $request->validate(LeadRules::contact(), LeadRules::messages());

        return $this->saveDetails($update, $lead, [
            'name' => $validated['name'],
            'phone' => ($validated['phone'] ?? null) ?: null,
            'email' => ($validated['email'] ?? null) ?: null,
        ], $admin);
    }

    public function updateCompany(Request $request, Lead $lead, UpdateLeadDetails $update): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        $validated = $request->validate(LeadRules::company(), LeadRules::messages());

        return $this->saveDetails($update, $lead, array_map(fn ($value) => $value ?: null, [
            'company' => $validated['company'] ?? null,
            'website' => $validated['website'] ?? null,
            'industry' => $validated['industry'] ?? null,
            'location' => $validated['location'] ?? null,
        ]), $admin);
    }

    public function updateDeal(Request $request, Lead $lead, UpdateLeadDetails $update): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        $validated = $request->validate(LeadRules::deal(), LeadRules::messages());

        // The free-text "lead source" is only editable on leads added by hand.
        $isManual = $lead->source->type === LeadSourceType::Manual;

        return $this->saveDetails($update, $lead, LeadRules::dealColumns($validated, includeLeadSourceText: $isManual), $admin);
    }

    public function assign(Request $request, Lead $lead, AssignLead $assignLead): RedirectResponse
    {
        $admin = $this->admin();
        abort_unless($this->access->canAssign($admin), 403);

        $validated = $request->validate(['assigned_to' => ['nullable', 'integer']]);
        $assigneeId = isset($validated['assigned_to']) ? (int) $validated['assigned_to'] : null;
        $before = $lead->assigned_to;

        $assignLead->handle($lead, $assigneeId, $admin);

        if ($before === $assigneeId) {
            return back();
        }

        return back()->with('success', $assigneeId === null ? 'Lead unassigned.' : 'Lead assigned.');
    }

    public function resolveDate(Request $request, Lead $lead, ResolveLeadDate $resolve): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);

        $validated = $request->validate([
            'kind' => ['required', Rule::in([ResolveLeadDate::MEETING, ResolveLeadDate::FOLLOW_UP])],
            'outcome' => ['required', Rule::in(['done', 'cancelled'])],
        ]);

        if (! $resolve->handle($lead, $validated['kind'], $validated['outcome'], $admin)) {
            return back();
        }

        $what = $validated['kind'] === ResolveLeadDate::MEETING ? 'Meeting' : 'Follow-up';

        return back()->with('success', $validated['outcome'] === 'done' ? "{$what} marked as done." : "{$what} cancelled.");
    }

    public function addNote(Request $request, Lead $lead, AddLeadNote $addNote): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        $validated = $request->validate(['note' => ['required', 'string', 'max:2000']]);

        $addNote->handle($lead, $validated['note'], $admin);

        return back()->with('success', 'Note added.');
    }

    public function destroy(Lead $lead, DeleteLead $deleteLead): RedirectResponse
    {
        $admin = $this->admin();
        abort_unless($this->access->canDelete($admin), 403);

        $deleteLead->handle($lead, $admin);

        return redirect()->route('admin.leads.index')->with('success', 'Lead deleted.');
    }

    public function export(Request $request): StreamedResponse
    {
        $admin = $this->admin();
        abort_unless($admin->isLeadManager(), 403);

        $query = LeadFilters::apply($this->access->visibleLeads($admin), LeadFilters::fromRequest($request), true)
            ->with(['source', 'status']);

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Lead ID', 'Name', 'Email', 'Phone', 'Source', 'Status', 'Priority', 'Assigned To', 'Created At', 'Closed At']);

            $query->chunkById(200, function ($leads) use ($handle): void {
                $names = $this->people->namesFor($leads->pluck('assigned_to'));

                foreach ($leads as $lead) {
                    fputcsv($handle, [
                        $lead->identifier,
                        self::csvSafe($lead->name),
                        self::csvSafe($lead->email),
                        self::csvSafe($lead->phone),
                        $lead->source->type->label(),
                        $lead->status->name,
                        $lead->priority->value,
                        $lead->assigned_to !== null ? ($names[$lead->assigned_to] ?? 'Deleted admin') : 'Unassigned',
                        $lead->created_at?->toDateTimeString(),
                        $lead->closed_at?->toDateTimeString(),
                    ]);
                }
            });

            fclose($handle);
        }, 'leads.csv', ['Content-Type' => 'text/csv']);
    }

    /**
     * Stops a spreadsheet from treating a cell as a formula.
     */
    private static function csvSafe(?string $value): ?string
    {
        if ($value !== null && $value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $columns
     */
    private function saveDetails(UpdateLeadDetails $update, Lead $lead, array $columns, Admin $admin): RedirectResponse
    {
        return $update->handle($lead, $columns, $admin) === []
            ? back()
            : back()->with('success', 'Lead updated.');
    }

    /**
     * @return array<string, mixed>|null
     */
    private function selectedLead(Request $request, Admin $admin): ?array
    {
        $id = $request->query('lead');

        if (! is_string($id) || $id === '') {
            return null;
        }

        $lead = Lead::query()->withMerged()->find($id)?->latestVersion();

        if ($lead === null || ! $this->access->canView($admin, $lead)) {
            return null;
        }

        $lead->markUpdateSeen();

        return $this->presenter->detail($lead, $admin);
    }

    private function authorizeUpdate(Lead $lead): Admin
    {
        $admin = $this->admin();
        abort_unless($this->access->canUpdate($admin, $lead), 403);

        return $admin;
    }

    private function admin(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }
}
