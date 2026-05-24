<?php

use App\Models\Admin;
use App\Models\User;

it('logs out an authenticated user and redirects to home', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('logout'))
        ->assertRedirect('/');

    $this->assertGuest();
});

it('regenerates the session token on logout', function () {
    $user = User::factory()->create();
    $tokenBefore = session()->token();

    $this->actingAs($user)->post(route('logout'));

    // Session should have been invalidated and regenerated (new token)
    expect(session()->token())->not->toBe($tokenBefore);
    $this->assertGuest();
});

it('redirects an admin-authenticated visitor away from user login page', function () {
    // An already-logged-in admin visiting the user login page should be sent to the admin panel.
    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('login'))
        ->assertRedirect(route('admin.dashboard'));
});

it('rejects login with missing credentials', function () {
    $this->post(route('login'), [])->assertInvalid(['email', 'password']);
});

it('rejects login with wrong password', function () {
    $user = User::factory()->create(['password' => bcrypt('correct')]);

    $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'wrong',
    ])->assertInvalid(['email']);

    $this->assertGuest();
});

it('redirects to intended page after successful login', function () {
    $user = User::factory()->create(['password' => bcrypt('secret')]);

    $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'secret',
    ])->assertRedirect('/');

    $this->assertAuthenticatedAs($user);
});
