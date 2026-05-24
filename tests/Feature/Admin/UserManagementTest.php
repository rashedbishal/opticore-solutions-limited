<?php

use App\Models\Admin;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

// --- Index ---
it('renders the user management index page', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.users.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/User/Index'));
});

// --- Create ---
it('renders the user create page', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.users.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/User/Create'));
});

// --- Store ---
it('creates a new user with valid data', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'Client One',
            'email' => 'client@example.com',
            'password' => 'SecurePass123!',
        ])
        ->assertRedirect(route('admin.users.index'));

    $this->assertDatabaseHas('users', [
        'name' => 'Client One',
        'email' => 'client@example.com',
    ]);
});

it('hashes the password when creating a user', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'Hashed Client',
            'email' => 'hashed@example.com',
            'password' => 'PlainPassword1!',
        ]);

    $user = User::where('email', 'hashed@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->password)->not->toBe('PlainPassword1!');
});

it('validates required fields when creating a user', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.users.store'), [])
        ->assertInvalid(['name', 'email', 'password']);
});

it('rejects duplicate email when creating a user', function () {
    User::factory()->create(['email' => 'existing@example.com']);

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'New User',
            'email' => 'existing@example.com',
            'password' => 'SecurePass123!',
        ])
        ->assertInvalid(['email']);
});

it('rejects passwords shorter than 8 characters', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'Short Pass',
            'email' => 'short@example.com',
            'password' => '1234567',
        ])
        ->assertInvalid(['password']);
});

// --- Edit ---
it('renders the user edit page with user data', function () {
    $user = User::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.users.edit', $user))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/User/Edit')
            ->where('user.id', $user->id)
            ->where('user.email', $user->email)
        );
});

// --- Update ---
it('updates a user name and email', function () {
    $user = User::factory()->create(['name' => 'Old Name']);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.users.update', $user), [
            'name' => 'Updated Name',
            'email' => $user->email,
        ])
        ->assertRedirect(route('admin.users.index'));

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'name' => 'Updated Name',
    ]);
});

it('updates the password when one is provided', function () {
    $user = User::factory()->create();
    $oldHash = $user->password;

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.users.update', $user), [
            'name' => $user->name,
            'email' => $user->email,
            'password' => 'NewSecurePass1!',
        ]);

    $user->refresh();
    expect($user->password)->not->toBe($oldHash);
});

it('does not change the password when the password field is empty on update', function () {
    $user = User::factory()->create();
    $oldHash = $user->password;

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.users.update', $user), [
            'name' => $user->name,
            'email' => $user->email,
            'password' => '',
        ]);

    $user->refresh();
    expect($user->password)->toBe($oldHash);
});

it('rejects a duplicate email when updating a user', function () {
    $userA = User::factory()->create(['email' => 'a@example.com']);
    $userB = User::factory()->create(['email' => 'b@example.com']);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.users.update', $userA), [
            'name' => $userA->name,
            'email' => 'b@example.com',
        ])
        ->assertInvalid(['email']);
});

it('allows updating a user with their own existing email', function () {
    $user = User::factory()->create(['email' => 'same@example.com']);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.users.update', $user), [
            'name' => 'Updated Name',
            'email' => 'same@example.com',
        ])
        ->assertRedirect(route('admin.users.index'));
});

// --- Destroy ---
it('deletes a user', function () {
    $user = User::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.users.destroy', $user))
        ->assertRedirect();

    $this->assertDatabaseMissing('users', ['id' => $user->id]);
});
