<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
    public function index(): Response
    {
        $admins = Admin::query()
            ->when(! $this->actor()->isMotherAdmin(), fn ($query) => $query->where('is_super_admin', false))
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/User/Index', [
            'users' => $admins,
        ]);
    }

    public function create(): Response
    {
        $this->authorizeMotherAdminOnly();

        return Inertia::render('Admin/User/Create', [
            'permissionOptions' => AdminPermissions::all(),
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
        ]);

        $fullAccess = (bool) ($validated['full_access'] ?? false);

        Admin::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'full_access' => $fullAccess,
            'permissions' => $fullAccess ? [] : array_values($validated['permissions'] ?? []),
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

        $rules = [
            'password' => 'nullable|string|min:8',
        ];

        if ($canEditProfile) {
            $rules['name'] = 'required|string|max:255';
            $rules['email'] = ['required', 'email', 'max:255', Rule::unique('admin.admins', 'email')->ignore($user->id)];
        }

        if ($canEditPermissions) {
            $rules['full_access'] = 'sometimes|boolean';
            $rules['permissions'] = 'sometimes|array';
            $rules['permissions.*'] = ['string', Rule::in(AdminPermissions::keys())];
        }

        $validated = $request->validate($rules);
        $payload = [];

        if ($canEditProfile) {
            $payload['name'] = $validated['name'];
            $payload['email'] = $validated['email'];
        }

        if (! empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        if ($canEditPermissions && ! $user->isMotherAdmin()) {
            $fullAccess = (bool) ($validated['full_access'] ?? false);
            $payload['full_access'] = $fullAccess;
            $payload['permissions'] = $fullAccess ? [] : array_values($validated['permissions'] ?? []);
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
}
