<?php

use App\Models\Task;
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

it('rejects names containing digits or special characters other than space, dot, or hyphen', function (string $name) {
    $this->post(route('register'), [
        'name' => $name,
        'email' => 'jane@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])->assertInvalid(['name']);

    $this->assertGuest();
})->with([
    'Jane99',
    'Jane_Doe',
    'Jane@Doe',
    'Jane#Doe',
    "Jane'Doe",
]);

it('accepts names with letters, spaces, dots, and hyphens', function (string $name) {
    $this->post(route('register'), [
        'name' => $name,
        'email' => 'jane@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])->assertRedirect(route('verification.notice'));

    $this->assertDatabaseHas('users', ['name' => $name]);
})->with([
    'Jane Doe',
    'Dr. Jane Doe',
    'Jane-Doe',
    'জেন ডো',
]);

it('rejects an invalid phone number format', function () {
    $this->post(route('register'), [
        'name' => 'Jane',
        'email' => 'jane@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'phone_number' => '01700000000',
    ])->assertInvalid(['phone_number']);
});

it('creates a brand new, unrelated account when registering with an email that belonged to a deleted account', function () {
    $original = User::factory()->create(['email' => 'reclaim@example.com', 'email_verified_at' => now()]);
    $task = Task::factory()->create(['user_id' => $original->id]);

    $this->actingAs($original)
        ->delete(route('profile.delete'), ['password' => 'password'])
        ->assertRedirect('/');

    $this->post(route('register'), [
        'name' => 'Attacker',
        'email' => 'reclaim@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])->assertRedirect(route('verification.notice'));

    $newUser = User::where('email', 'reclaim@example.com')->first();

    expect($newUser)->not->toBeNull();
    expect($newUser->id)->not->toBe($original->id);
    expect($newUser->email_verified_at)->toBeNull();
    $this->assertAuthenticatedAs($newUser);

    $original->refresh();
    expect($original->trashed())->toBeTrue();
    expect($original->original_email)->toBe('reclaim@example.com');

    // The old account's workflow history stays put — it never transfers to the new account.
    expect(Task::find($task->id)->user_id)->toBe($original->id);
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
