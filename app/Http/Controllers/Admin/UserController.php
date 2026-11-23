<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Leads\Enums\LeadRole;
use App\Models\Admin;
use App\Support\AdminPermissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        return Inertia::render('Admin/User/Index', [
            'users' => $admins,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        $this->authorizeMotherAdminOnly();

        return Inertia::render('Admin/User/Create', [
            'permissionOptions' => AdminPermissions::all(),
            'leadRoleOptions' => $this->leadRoleOptions(),
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
            'lead_role' => ['nullable', Rule::enum(LeadRole::class)],
        ]);

        $fullAccess = (bool) ($validated['full_access'] ?? false);

        Admin::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'full_access' => $fullAccess,
            'permissions' => $fullAccess ? [] : array_values($validated['permissions'] ?? []),
            // Independent of full_access: the mother admin always picks the
            // lead role explicitly.
            'lead_role' => $validated['lead_role'] ?? null,
        ]);

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
            'leadRoleOptions' => $this->leadRoleOptions(),
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
            $rules['lead_role'] = ['nullable', Rule::enum(LeadRole::class)];
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
            $payload['full_access'] = $fullAccess;
            $payload['permissions'] = $fullAccess ? [] : array_values($validated['permissions'] ?? []);
            $payload['lead_role'] = $validated['lead_role'] ?? null;
        }

        $user->update($payload);

        return redirect()->route('admin.users.index')->with('success', 'Admin updated.');
    }

    public function destroy(Admin $user): RedirectResponse
    {
        $this->authorizeMotherAdminOnly();

        if ($this->actor()->id === $user->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return back()->with('success', 'Admin deleted.');
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
}
