<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Leads\Actions\TransferAdminLeads;
use App\Leads\Enums\LeadRole;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Leads\Services\LeadPeople;
use App\Models\Admin;
use App\Support\AdminPermissions;
use App\Support\AdminSections;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $admins = Admin::query()
            ->when(! $this->actor()->isMotherAdmin(), fn ($query) => $query->where('is_super_admin', false))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $leadCounts = Lead::query()
            ->whereIn('assigned_to', collect($admins->items())->pluck('id'))
            ->groupBy('assigned_to')
            ->selectRaw('assigned_to, count(*) as total')
            ->pluck('total', 'assigned_to');

        $admins->through(function (Admin $admin) use ($leadCounts): Admin {
            $admin->setAttribute('owned_leads_count', (int) ($leadCounts[$admin->id] ?? 0));

            return $admin;
        });

        return Inertia::render('Admin/User/Index', [
            'users' => $admins,
            'filters' => $request->only(['search']),
            // People who can receive a deleted admin's leads.
            'leadReceivers' => app(LeadPeople::class)->assignableOptions(),
        ]);
    }

    public function create(): Response
    {
        $this->authorizeMotherAdminOnly();

        return Inertia::render('Admin/User/Create', [
            'permissionOptions' => AdminPermissions::all(),
            'sectionOptions' => AdminSections::grantableOptions(),
            'leadRoleOptions' => $this->leadRoleOptions(),
            'leadSourceOptions' => $this->leadSourceOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeMotherAdminOnly();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:admin.admins,email',
            'password' => 'required|string|min:8',
            'full_access' => 'sometimes|boolean',
            'permissions' => 'sometimes|array',
            'permissions.*' => ['string', Rule::in(AdminPermissions::keys())],
            'section_roles' => ['sometimes', 'array'],
            'section_roles.*' => ['string', Rule::in(AdminSections::keys())],
            'lead_role' => ['nullable', Rule::enum(LeadRole::class)],
            'unassigned_lead_source_ids' => ['sometimes', 'array'],
            'unassigned_lead_source_ids.*' => ['string', Rule::exists('lead_sources', 'id')],
        ]);

        $fullAccess = (bool) ($validated['full_access'] ?? false);
        [$sectionRoles, $permissions] = $this->normalizeAccess($fullAccess, $validated);

        $admin = Admin::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'full_access' => $fullAccess,
            'permissions' => $permissions,
            'section_roles' => $sectionRoles,
            // Independent of full_access: the mother admin always picks the
            // lead role explicitly.
            'lead_role' => $validated['lead_role'] ?? null,
        ]);

        $this->syncUnassignedLeadSources($admin, $validated['unassigned_lead_source_ids'] ?? []);

        return redirect()->route('admin.users.index')->with('success', 'Admin created.');
    }

    public function edit(Admin $user): Response
    {
        $actor = $this->actor();

        // Only the mother admin can view or change their own account — other
        // admins cannot see, edit, or change the mother admin's password.
        abort_if($user->isMotherAdmin() && $actor->id !== $user->id, 403);

        $editingSelf = $actor->id === $user->id;

        return Inertia::render('Admin/User/Edit', [
            'user' => $user,
            'permissionOptions' => AdminPermissions::all(),
            'sectionOptions' => AdminSections::grantableOptions(),
            // Roles as the form should show them (stored roles plus those
            // implied by modules the admin already holds).
            'sectionRoles' => $user->isMotherAdmin() ? [] : AdminSections::rolesFor($user),
            'leadRoleOptions' => $this->leadRoleOptions(),
            'leadSourceOptions' => $this->leadSourceOptions(),
            'unassignedLeadSourceIds' => DB::table('lead_source_unassigned_viewers')->where('admin_id', $user->id)->pluck('lead_source_id')->all(),
            'canEditProfile' => $actor->isMotherAdmin() || $editingSelf,
            'canEditPermissions' => $actor->isMotherAdmin() && ! $editingSelf,
            'isEditingSelf' => $editingSelf,
        ]);
    }

    public function update(Request $request, Admin $user): RedirectResponse
    {
        $actor = $this->actor();

        // Only the mother admin can update their own account — other admins
        // cannot see, edit, or change the mother admin's password.
        abort_if($user->isMotherAdmin() && $actor->id !== $user->id, 403);

        $editingSelf = $actor->id === $user->id;
        $canEditProfile = $actor->isMotherAdmin() || $editingSelf;
        $canEditPermissions = $actor->isMotherAdmin() && ! $editingSelf;

        $rules = [];

        if ($canEditProfile) {
            $rules['name'] = 'required|string|max:255';
            $rules['email'] = ['required', 'email', 'max:255', Rule::unique('admin.admins', 'email')->ignore($user->id)];
            $rules['password'] = 'nullable|string|min:8';
        }

        if ($canEditPermissions) {
            $rules['full_access'] = 'sometimes|boolean';
            $rules['permissions'] = 'sometimes|array';
            $rules['permissions.*'] = ['string', Rule::in(AdminPermissions::keys())];
            $rules['section_roles'] = ['sometimes', 'array'];
            $rules['section_roles.*'] = ['string', Rule::in(AdminSections::keys())];
            $rules['lead_role'] = ['nullable', Rule::enum(LeadRole::class)];
            $rules['unassigned_lead_source_ids'] = ['sometimes', 'array'];
            $rules['unassigned_lead_source_ids.*'] = ['string', Rule::exists('lead_sources', 'id')];
        }

        $validated = $request->validate($rules);
        $payload = [];

        if ($canEditProfile) {
            $payload['name'] = $validated['name'];
            $payload['email'] = $validated['email'];

            // Password is gated by canEditProfile too — only the mother
            // admin or the account owner may change it. Without this, an
            // admin holding only the "users" (Admins section) permission
            // could silently reset another regular admin's password and
            // hijack their account.
            if (! empty($validated['password'])) {
                $payload['password'] = Hash::make($validated['password']);
            }
        }

        if ($canEditPermissions && ! $user->isMotherAdmin()) {
            $fullAccess = (bool) ($validated['full_access'] ?? false);
            [$sectionRoles, $permissions] = $this->normalizeAccess($fullAccess, $validated);
            $payload['full_access'] = $fullAccess;
            $payload['permissions'] = $permissions;
            $payload['section_roles'] = $sectionRoles;
            $payload['lead_role'] = $validated['lead_role'] ?? null;
        }

        $user->update($payload);

        if ($canEditPermissions && ! $user->isMotherAdmin()) {
            $this->syncUnassignedLeadSources($user, $validated['unassigned_lead_source_ids'] ?? []);
        }

        return redirect()->route('admin.users.index')->with('success', 'Admin updated.');
    }

    public function destroy(Request $request, Admin $user, TransferAdminLeads $transferLeads, LeadPeople $people): RedirectResponse
    {
        $this->authorizeMotherAdminOnly();

        if ($this->actor()->id === $user->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        // Leads they still own go to whoever the mother admin picked.
        $receiver = null;

        if (Lead::query()->where('assigned_to', $user->id)->exists()) {
            $receiverId = (int) $request->input('transfer_to');
            $receiver = $receiverId !== $user->id ? $people->findLeadUser($receiverId) : null;

            if ($receiver === null) {
                return back()->with('error', 'Choose who should receive this admin\'s leads before deleting.');
            }
        }

        $transferLeads->handle($user, $receiver, $this->actor());

        $user->delete();

        return back()->with('success', 'Admin deleted.');
    }

    /**
     * Section roles and module permissions as they get stored. Full access
     * clears both (it already grants every section and module). Otherwise
     * every granted module also adds its section's role, so a module can never
     * be granted without the section it lives in.
     *
     * @param  array<string, mixed>  $validated
     * @return array{0: array<int, string>, 1: array<int, string>}
     */
    private function normalizeAccess(bool $fullAccess, array $validated): array
    {
        if ($fullAccess) {
            return [[], []];
        }

        $permissions = array_values(array_unique($validated['permissions'] ?? []));
        $sectionRoles = $validated['section_roles'] ?? [];

        foreach ($permissions as $key) {
            $sectionRoles[] = AdminSections::sectionOf($key);
        }

        $sectionRoles = array_values(array_filter(
            AdminSections::keys(),
            fn (string $key): bool => in_array($key, $sectionRoles, true),
        ));

        return [$sectionRoles, $permissions];
    }

    private function actor(): Admin
    {
        /** @var Admin */
        return Auth::guard('admin')->user();
    }

    /**
     * Abort with 403 unless the acting admin is the mother admin.
     * Used to gate create/store/destroy, which are mother-admin-only.
     */
    private function authorizeMotherAdminOnly(): void
    {
        abort_unless($this->actor()->isMotherAdmin(), 403);
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    private function leadRoleOptions(): array
    {
        return array_map(
            fn (LeadRole $role): array => ['value' => $role->value, 'label' => $role->label()],
            LeadRole::cases(),
        );
    }

    /**
     * @return array<int, array{id: string, name: string}>
     */
    private function leadSourceOptions(): array
    {
        return LeadSource::query()->orderBy('name')->get(['id', 'name'])
            ->map(fn (LeadSource $source): array => ['id' => $source->id, 'name' => $source->name])
            ->all();
    }

    /**
     * Unowned-lead access only applies to agents; any other role clears it.
     *
     * @param  array<int, string>  $sourceIds
     */
    private function syncUnassignedLeadSources(Admin $admin, array $sourceIds): void
    {
        DB::table('lead_source_unassigned_viewers')->where('admin_id', $admin->id)->delete();

        if ($admin->lead_role !== LeadRole::Agent) {
            return;
        }

        foreach (array_unique($sourceIds) as $sourceId) {
            DB::table('lead_source_unassigned_viewers')->insert([
                'lead_source_id' => $sourceId,
                'admin_id' => $admin->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
