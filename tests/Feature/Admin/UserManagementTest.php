<?php

use App\Models\Admin;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    // Default factory state produces a "mother admin" (is_super_admin + full_access).
    $this->mother = Admin::factory()->create();
    // Granted access to the "Admins" section itself, so these tests exercise
    // the controller's role-aware field rules rather than getting stopped
    // earlier by the permission middleware (every admin can always manage
    // their own profile regardless of this grant — see EnsureAdminHasPermission).
    $this->regular = Admin::factory()->withPermissions(['users'])->create();
});

// --- Index ---
it('renders the admin management index page for the mother admin', function () {
    $this->actingAs($this->mother, 'admin')
        ->get(route('admin.users.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/User/Index')
            ->has('users.data')
        );
});

it('renders the admin management index page for a regular admin', function () {
    $this->actingAs($this->regular, 'admin')
        ->get(route('admin.users.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/User/Index'));
});

it('includes the mother admin in the roster shown to the mother admin', function () {
    $this->actingAs($this->mother, 'admin')
        ->get(route('admin.users.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.data', fn ($users) => collect($users)->contains(
                fn ($user) => $user['id'] === $this->mother->id
            ))
        );
});

it('hides the mother admin from the roster shown to regular admins', function () {
    $this->actingAs($this->regular, 'admin')
        ->get(route('admin.users.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.data', fn ($users) => collect($users)->doesntContain(
                fn ($user) => $user['id'] === $this->mother->id
            ))
        );
});

// --- Create / Store (mother-admin only) ---
it('allows the mother admin to view the admin create page', function () {
    $this->actingAs($this->mother, 'admin')
        ->get(route('admin.users.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/User/Create')
            ->has('permissionOptions')
        );
});

it('blocks a regular admin from viewing the admin create page', function () {
    $this->actingAs($this->regular, 'admin')
        ->get(route('admin.users.create'))
        ->assertForbidden();
});

it('blocks a regular admin from creating an admin', function () {
    $this->actingAs($this->regular, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'Sneaky Admin',
            'email' => 'sneaky@example.com',
            'password' => 'SecurePass123!',
        ])
        ->assertForbidden();

    $this->assertDatabaseMissing('admins', ['email' => 'sneaky@example.com'], 'admin');
});

it('lets the mother admin create a new admin without permissions', function () {
    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'New Admin',
            'email' => 'new-admin@example.com',
            'password' => 'SecurePass123!',
        ])
        ->assertRedirect(route('admin.users.index'));

    $created = Admin::where('email', 'new-admin@example.com')->first();
    expect($created)->not->toBeNull();
    expect($created->is_super_admin)->toBeFalse();
    expect($created->full_access)->toBeFalse();
    expect($created->permissions)->toBe([]);
});

it('hashes the password when creating an admin', function () {
    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'Hashed Admin',
            'email' => 'hashed@example.com',
            'password' => 'PlainPassword1!',
        ]);

    $created = Admin::where('email', 'hashed@example.com')->first();
    expect($created)->not->toBeNull();
    expect($created->password)->not->toBe('PlainPassword1!');
});

it('persists selected permissions when full access is not granted', function () {
    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'Limited Admin',
            'email' => 'limited@example.com',
            'password' => 'SecurePass123!',
            'permissions' => ['blogs', 'faqs'],
        ])
        ->assertRedirect(route('admin.users.index'));

    $created = Admin::where('email', 'limited@example.com')->first();
    expect($created->full_access)->toBeFalse();
    expect($created->permissions)->toBe(['blogs', 'faqs']);
});

it('grants full access and clears individual permissions when full access is checked', function () {
    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'Full Access Admin',
            'email' => 'full-access@example.com',
            'password' => 'SecurePass123!',
            'full_access' => true,
            'permissions' => ['blogs', 'faqs'],
        ])
        ->assertRedirect(route('admin.users.index'));

    $created = Admin::where('email', 'full-access@example.com')->first();
    expect($created->full_access)->toBeTrue();
    expect($created->permissions)->toBe([]);
});

it('validates required fields when creating an admin', function () {
    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.users.store'), [])
        ->assertInvalid(['name', 'email', 'password']);
});

it('rejects duplicate email when creating an admin', function () {
    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'Duplicate Admin',
            'email' => $this->regular->email,
            'password' => 'SecurePass123!',
        ])
        ->assertInvalid(['email']);
});

it('rejects passwords shorter than 8 characters when creating an admin', function () {
    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'Short Pass',
            'email' => 'short@example.com',
            'password' => '1234567',
        ])
        ->assertInvalid(['password']);
});

it('rejects unknown permission keys when creating an admin', function () {
    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'Bad Perms',
            'email' => 'bad-perms@example.com',
            'password' => 'SecurePass123!',
            'permissions' => ['not-a-real-section'],
        ])
        ->assertInvalid(['permissions.0']);
});

// --- Edit (Inertia props reflect the field-level rules) ---
it('exposes full edit permissions when the mother admin edits another admin', function () {
    $this->actingAs($this->mother, 'admin')
        ->get(route('admin.users.edit', $this->regular))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/User/Edit')
            ->where('canEditProfile', true)
            ->where('canEditPermissions', true)
            ->where('isEditingSelf', false)
        );
});

it('hides permission editing when the mother admin edits themselves', function () {
    $this->actingAs($this->mother, 'admin')
        ->get(route('admin.users.edit', $this->mother))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canEditProfile', true)
            ->where('canEditPermissions', false)
            ->where('isEditingSelf', true)
        );
});

it('allows a regular admin to edit their own profile but not permissions', function () {
    $this->actingAs($this->regular, 'admin')
        ->get(route('admin.users.edit', $this->regular))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canEditProfile', true)
            ->where('canEditPermissions', false)
            ->where('isEditingSelf', true)
        );
});

it('restricts a regular admin editing another admin to password only', function () {
    $other = Admin::factory()->regular()->create();

    $this->actingAs($this->regular, 'admin')
        ->get(route('admin.users.edit', $other))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canEditProfile', false)
            ->where('canEditPermissions', false)
            ->where('isEditingSelf', false)
        );
});

it('blocks a regular admin from viewing the mother admins edit page', function () {
    $this->actingAs($this->regular, 'admin')
        ->get(route('admin.users.edit', $this->mother))
        ->assertForbidden();
});

// --- Update ---
it('lets the mother admin update another admin name, email, password, and permissions', function () {
    $this->actingAs($this->mother, 'admin')
        ->put(route('admin.users.update', $this->regular), [
            'name' => 'Renamed Admin',
            'email' => 'renamed@example.com',
            'password' => 'NewSecurePass1!',
            'permissions' => ['blogs', 'brands'],
        ])
        ->assertRedirect(route('admin.users.index'));

    $this->regular->refresh();
    expect($this->regular->name)->toBe('Renamed Admin');
    expect($this->regular->email)->toBe('renamed@example.com');
    expect($this->regular->full_access)->toBeFalse();
    expect($this->regular->permissions)->toBe(['blogs', 'brands']);
});

it('lets the mother admin grant full access to another admin via update', function () {
    $this->actingAs($this->mother, 'admin')
        ->put(route('admin.users.update', $this->regular), [
            'name' => $this->regular->name,
            'email' => $this->regular->email,
            'full_access' => true,
            'permissions' => ['blogs'],
        ])
        ->assertRedirect(route('admin.users.index'));

    $this->regular->refresh();
    expect($this->regular->full_access)->toBeTrue();
    expect($this->regular->permissions)->toBe([]);
});

it('lets the mother admin update their own name, email, and password', function () {
    $oldHash = $this->mother->password;

    $this->actingAs($this->mother, 'admin')
        ->put(route('admin.users.update', $this->mother), [
            'name' => 'Updated Mother',
            'email' => 'updated-mother@example.com',
            'password' => 'AnotherSecurePass1!',
        ])
        ->assertRedirect(route('admin.users.index'));

    $this->mother->refresh();
    expect($this->mother->name)->toBe('Updated Mother');
    expect($this->mother->email)->toBe('updated-mother@example.com');
    expect($this->mother->password)->not->toBe($oldHash);
});

it('ignores a crafted permissions payload when the mother admin edits themselves', function () {
    $originalPermissions = $this->mother->permissions;
    $originalFullAccess = $this->mother->full_access;

    $this->actingAs($this->mother, 'admin')
        ->put(route('admin.users.update', $this->mother), [
            'name' => $this->mother->name,
            'email' => $this->mother->email,
            'full_access' => false,
            'permissions' => ['blogs'],
        ])
        ->assertRedirect(route('admin.users.index'));

    $this->mother->refresh();
    expect($this->mother->full_access)->toBe($originalFullAccess);
    expect($this->mother->permissions)->toBe($originalPermissions);
    expect($this->mother->is_super_admin)->toBeTrue();
});

it('lets a regular admin update their own name, email, and password', function () {
    $oldHash = $this->regular->password;

    $this->actingAs($this->regular, 'admin')
        ->put(route('admin.users.update', $this->regular), [
            'name' => 'Updated Self',
            'email' => 'updated-self@example.com',
            'password' => 'YetAnotherSecure1!',
        ])
        ->assertRedirect(route('admin.users.index'));

    $this->regular->refresh();
    expect($this->regular->name)->toBe('Updated Self');
    expect($this->regular->email)->toBe('updated-self@example.com');
    expect($this->regular->password)->not->toBe($oldHash);
});

it('ignores a crafted permissions payload when a regular admin edits themselves', function () {
    $originalPermissions = $this->regular->permissions;
    $originalFullAccess = $this->regular->full_access;

    $this->actingAs($this->regular, 'admin')
        ->put(route('admin.users.update', $this->regular), [
            'name' => $this->regular->name,
            'email' => $this->regular->email,
            'full_access' => true,
            'permissions' => ['blogs'],
        ])
        ->assertRedirect(route('admin.users.index'));

    $this->regular->refresh();
    expect($this->regular->full_access)->toBe($originalFullAccess);
    expect($this->regular->permissions)->toBe($originalPermissions);
});

it('restricts a regular admin updating another admin to the password field only', function () {
    $other = Admin::factory()->regular()->create([
        'name' => 'Original Name',
        'email' => 'original@example.com',
    ]);
    $oldHash = $other->password;

    $this->actingAs($this->regular, 'admin')
        ->put(route('admin.users.update', $other), [
            'name' => 'Hacked Name',
            'email' => 'hacked@example.com',
            'password' => 'BrandNewSecure1!',
            'full_access' => true,
            'permissions' => ['blogs'],
        ])
        ->assertRedirect(route('admin.users.index'));

    $other->refresh();
    expect($other->name)->toBe('Original Name');
    expect($other->email)->toBe('original@example.com');
    expect($other->full_access)->toBeFalse();
    expect($other->permissions)->toBe([]);
    expect($other->password)->not->toBe($oldHash);
});

it('does not change the password when the password field is empty on update', function () {
    $oldHash = $this->regular->password;

    $this->actingAs($this->regular, 'admin')
        ->put(route('admin.users.update', $this->regular), [
            'name' => $this->regular->name,
            'email' => $this->regular->email,
            'password' => '',
        ]);

    $this->regular->refresh();
    expect($this->regular->password)->toBe($oldHash);
});

it('rejects a duplicate email when an admin updates their own profile', function () {
    $this->actingAs($this->regular, 'admin')
        ->put(route('admin.users.update', $this->regular), [
            'name' => $this->regular->name,
            'email' => $this->mother->email,
        ])
        ->assertInvalid(['email']);
});

it('allows updating an admin with their own existing email', function () {
    $this->actingAs($this->regular, 'admin')
        ->put(route('admin.users.update', $this->regular), [
            'name' => 'Same Email Admin',
            'email' => $this->regular->email,
        ])
        ->assertRedirect(route('admin.users.index'));
});

it('blocks a regular admin from updating the mother admin, including their password', function () {
    $oldHash = $this->mother->password;

    $this->actingAs($this->regular, 'admin')
        ->put(route('admin.users.update', $this->mother), [
            'name' => 'Hacked Mother',
            'email' => 'hacked-mother@example.com',
            'password' => 'BrandNewSecure1!',
        ])
        ->assertForbidden();

    $this->mother->refresh();
    expect($this->mother->name)->not->toBe('Hacked Mother');
    expect($this->mother->password)->toBe($oldHash);
});

// --- Destroy (mother-admin only, no self-deletion) ---
it('lets the mother admin delete another admin', function () {
    $this->actingAs($this->mother, 'admin')
        ->delete(route('admin.users.destroy', $this->regular))
        ->assertRedirect();

    $this->assertDatabaseMissing('admins', ['id' => $this->regular->id], 'admin');
});

it('prevents the mother admin from deleting their own account', function () {
    $this->actingAs($this->mother, 'admin')
        ->delete(route('admin.users.destroy', $this->mother))
        ->assertRedirect();

    $this->assertDatabaseHas('admins', ['id' => $this->mother->id], 'admin');
});

it('blocks a regular admin from deleting any admin, including themselves', function () {
    $this->actingAs($this->regular, 'admin')
        ->delete(route('admin.users.destroy', $this->mother))
        ->assertForbidden();

    $this->actingAs($this->regular, 'admin')
        ->delete(route('admin.users.destroy', $this->regular))
        ->assertForbidden();

    $this->assertDatabaseHas('admins', ['id' => $this->mother->id], 'admin');
    $this->assertDatabaseHas('admins', ['id' => $this->regular->id], 'admin');
});
