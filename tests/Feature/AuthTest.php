<?php

use App\Models\User;

it('displays the login page', function () {
    $this->get('/login')->assertSuccessful();
});

it('authenticates a user with valid credentials', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password123',
    ])->assertRedirect('/admin');

    $this->assertAuthenticatedAs($user);
});

it('rejects invalid credentials', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrongpassword',
    ])->assertInvalid(['email']);

    $this->assertGuest();
});

it('protects the admin dashboard route from unauthenticated users', function () {
    $this->get('/admin')->assertRedirect('/login');
});

it('allows authenticated users to access the admin dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/admin')
        ->assertSuccessful();
});
