<?php

use App\Models\Admin;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the admin login page for guests', function () {
    $this->get(route('admin.login'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Auth/Login'));
});

it('redirects an already-authenticated admin away from the login page', function () {
    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.login'))
        ->assertRedirect('/admin');
});

it('requires email and password to log in', function () {
    $this->post(route('admin.login'), [])
        ->assertInvalid(['email', 'password']);
});

it('rejects a non-existent admin email', function () {
    $this->post(route('admin.login'), [
        'email' => 'nobody@example.com',
        'password' => 'password',
    ])->assertInvalid(['email']);

    $this->assertGuest('admin');
});

it('rejects wrong password for a real admin', function () {
    $admin = Admin::factory()->create();

    $this->post(route('admin.login'), [
        'email' => $admin->email,
        'password' => 'wrong-password',
    ])->assertInvalid(['email']);

    $this->assertGuest('admin');
});

it('authenticates admin with correct credentials', function () {
    $admin = Admin::factory()->create(['password' => Hash::make('correct-pass')]);

    $this->post(route('admin.login'), [
        'email' => $admin->email,
        'password' => 'correct-pass',
    ])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Auth/Login')
            ->where('successName', $admin->name)
        );

    $this->assertAuthenticatedAs($admin, 'admin');
});

it('logs out an authenticated admin and clears the session', function () {
    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->post(route('admin.logout'))
        ->assertRedirect(route('admin.login'));

    $this->assertGuest('admin');
});
