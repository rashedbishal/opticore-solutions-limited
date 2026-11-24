<?php

use App\Models\Admin;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('displays the login page', function () {
    $this->get('/login')->assertStatus(200);
});

it('authenticates a user with valid credentials', function () {
    $user = User::factory()->create([
        'password' => Hash::make('password123'),
    ]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password123',
    ])->assertRedirect('/');

    $this->assertAuthenticatedAs($user);
});

it('rejects invalid credentials', function () {
    $user = User::factory()->create([
        'password' => Hash::make('password123'),
    ]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrongpassword',
    ])->assertInvalid(['email']);

    $this->assertGuest();
});

it('protects the admin dashboard route from unauthenticated users', function () {
    $this->get('/admin')->assertRedirect(route('admin.login'));
});

it('allows authenticated admins to access the admin home and dashboard', function () {
    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->get('/admin')
        ->assertSuccessful();

    $this->actingAs($admin, 'admin')
        ->get('/admin/dashboard')
        ->assertSuccessful();
});
