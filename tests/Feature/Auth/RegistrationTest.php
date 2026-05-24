<?php

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the registration page', function () {
    $this->get(route('register'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Auth/Register'));
});

it('registers a user with valid data and logs them in', function () {
    Event::fake([Registered::class]);

    $this->post(route('register'), [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])->assertRedirect(route('verification.notice'));

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
    ]);

    Event::assertDispatched(Registered::class);
});

it('marks the newly registered user as unverified', function () {
    $this->post(route('register'), [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $user = User::where('email', 'jane@example.com')->first();
    expect($user->email_verified_at)->toBeNull();
});

it('rejects registration when email is already taken', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->post(route('register'), [
        'name' => 'Someone',
        'email' => 'taken@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])->assertInvalid(['email']);

    $this->assertGuest();
});

it('rejects registration when password confirmation does not match', function () {
    $this->post(route('register'), [
        'name' => 'Jane',
        'email' => 'jane@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Different123!',
    ])->assertInvalid(['password']);

    $this->assertGuest();
});

it('requires name, email, and password', function () {
    $this->post(route('register'), [])
        ->assertInvalid(['name', 'email', 'password']);
});

it('rejects an invalid phone number format', function () {
    $this->post(route('register'), [
        'name' => 'Jane',
        'email' => 'jane@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'phone_number' => '01700000000',
    ])->assertInvalid(['phone_number']);
});

it('accepts a valid E.164 phone number', function () {
    $this->post(route('register'), [
        'name' => 'Jane',
        'email' => 'jane@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'phone_number' => '+8801700000000',
    ])->assertRedirect(route('verification.notice'));

    $this->assertDatabaseHas('users', ['phone_number' => '+8801700000000']);
});
