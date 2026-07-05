<?php

use App\Models\Admin;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

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
    $user = User::factory()->create(['password' => Hash::make('correct')]);

    $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'wrong',
    ])->assertInvalid(['email']);

    $this->assertGuest();
});

it('redirects to intended page after successful login', function () {
    $user = User::factory()->create(['password' => Hash::make('secret')]);

    $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'secret',
    ])->assertRedirect('/');

    $this->assertAuthenticatedAs($user);
});

it('logs in a user with a legacy bcrypt password and silently upgrades it to argon2id', function () {
    // Bypasses the `password` column's `hashed` cast (Eloquent's cast would
    // reject assigning an already-bcrypt hash now that the app's default
    // driver is argon2id) to simulate a real pre-migration user account.
    $user = User::factory()->create();
    DB::table('users')->where('id', $user->id)->update(['password' => bcrypt('legacy-password')]);

    $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'legacy-password',
    ])->assertRedirect('/');

    $this->assertAuthenticatedAs($user);

    expect(DB::table('users')->where('id', $user->id)->value('password'))
        ->toStartWith('$argon2id$');
});
