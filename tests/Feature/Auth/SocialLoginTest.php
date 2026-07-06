<?php

use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

it('redirects to the google oauth provider', function () {
    Socialite::fake('google');

    $this->get(route('social.redirect', ['provider' => 'google']))
        ->assertRedirect();
});

it('redirects to the facebook oauth provider', function () {
    Socialite::fake('facebook');

    $this->get(route('social.redirect', ['provider' => 'facebook']))
        ->assertRedirect();
});

it('returns a 404 for an unsupported social provider on redirect', function () {
    $this->get(route('social.redirect', ['provider' => 'twitter']))
        ->assertNotFound();
});

it('creates a new user from a google callback and logs them in', function () {
    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-12345',
        'name' => 'Jane Google',
        'email' => 'jane.google@example.com',
        'avatar' => 'https://example.com/avatar.jpg',
    ]));

    $this->get(route('social.callback', ['provider' => 'google']))
        ->assertRedirect('/');

    $this->assertDatabaseHas('users', [
        'name' => 'Jane Google',
        'email' => 'jane.google@example.com',
        'google_id' => 'google-12345',
    ]);

    $user = User::where('email', 'jane.google@example.com')->first();
    $this->assertAuthenticatedAs($user);
});

it('creates a new user from a facebook callback and logs them in', function () {
    Socialite::fake('facebook', (new SocialiteUser)->map([
        'id' => 'facebook-67890',
        'name' => 'Jane Facebook',
        'email' => 'jane.facebook@example.com',
        'avatar' => 'https://example.com/avatar-fb.jpg',
    ]));

    $this->get(route('social.callback', ['provider' => 'facebook']))
        ->assertRedirect('/');

    $this->assertDatabaseHas('users', [
        'name' => 'Jane Facebook',
        'email' => 'jane.facebook@example.com',
        'facebook_id' => 'facebook-67890',
    ]);

    $user = User::where('email', 'jane.facebook@example.com')->first();
    $this->assertAuthenticatedAs($user);
});

it('stores a new social account with the email lowercased regardless of the provider casing', function () {
    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-mixed-case-1',
        'name' => 'Mixed Case',
        'email' => 'Mixed.Case@Example.com',
        'avatar' => 'https://example.com/mixed.jpg',
    ]));

    $this->get(route('social.callback', ['provider' => 'google']))
        ->assertRedirect('/');

    $this->assertDatabaseHas('users', ['email' => 'mixed.case@example.com']);
    $this->assertDatabaseMissing('users', ['email' => 'Mixed.Case@Example.com']);
});

it('links a social account to an existing user matched by email in a different case', function () {
    $existing = User::factory()->create(['email' => 'casemismatch@example.com']);

    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-case-mismatch-1',
        'name' => 'Case Mismatch',
        'email' => 'CaseMismatch@Example.com',
        'avatar' => 'https://example.com/case.jpg',
    ]));

    $this->get(route('social.callback', ['provider' => 'google']))
        ->assertRedirect('/');

    expect(User::where('email', 'casemismatch@example.com')->count())->toBe(1);

    $existing->refresh();
    expect($existing->google_id)->toBe('google-case-mismatch-1');

    $this->assertAuthenticatedAs($existing);
});

it('links a social account to an existing user matched by email', function () {
    $existing = User::factory()->create(['email' => 'linked@example.com']);

    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-99999',
        'name' => 'Linked Account',
        'email' => 'linked@example.com',
        'avatar' => 'https://example.com/linked.jpg',
    ]));

    $this->get(route('social.callback', ['provider' => 'google']))
        ->assertRedirect('/');

    expect(User::where('email', 'linked@example.com')->count())->toBe(1);

    $existing->refresh();
    expect($existing->google_id)->toBe('google-99999');

    $this->assertAuthenticatedAs($existing);
});

it('restores a self-deleted account via social login and recovers its real email', function () {
    $existing = User::factory()->create([
        'email' => 'restoreme@example.com',
        'google_id' => 'google-restore-1',
    ]);

    $this->actingAs($existing)
        ->delete(route('profile.delete'), ['password' => 'password'])
        ->assertRedirect('/');

    $existing->refresh();
    expect($existing->trashed())->toBeTrue();
    expect($existing->getRawOriginal('email'))->toBe('deleted-user-'.$existing->id.'@deleted.invalid');
    expect($existing->original_email)->toBe('restoreme@example.com');

    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-restore-1',
        'name' => 'Restore Me',
        'email' => 'restoreme@example.com',
        'avatar' => 'https://example.com/restored.jpg',
    ]));

    $this->get(route('social.callback', ['provider' => 'google']))
        ->assertRedirect('/');

    $existing->refresh();
    expect($existing->trashed())->toBeFalse();
    expect($existing->email)->toBe('restoreme@example.com');
    expect($existing->original_email)->toBeNull();

    $this->assertAuthenticatedAs($existing);
});

it('logs in an existing user matched by provider id', function () {
    $existing = User::factory()->create([
        'email' => 'returning@example.com',
        'google_id' => 'google-existing-1',
    ]);

    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-existing-1',
        'name' => 'Returning User',
        'email' => 'returning@example.com',
        'avatar' => 'https://example.com/returning.jpg',
    ]));

    $this->get(route('social.callback', ['provider' => 'google']))
        ->assertRedirect('/');

    expect(User::where('google_id', 'google-existing-1')->count())->toBe(1);
    $this->assertAuthenticatedAs($existing);
});

it('refuses to auto-link a social login to an existing user whose email is unverified', function () {
    $existing = User::factory()->unverified()->create(['email' => 'unverified@example.com']);

    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-attacker-1',
        'name' => 'Attacker Controlled',
        'email' => 'unverified@example.com',
        'avatar' => 'https://example.com/attacker.jpg',
    ]));

    $this->get(route('social.callback', ['provider' => 'google']))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('social');

    $this->assertGuest();

    $existing->refresh();
    expect($existing->google_id)->toBeNull();
    expect($existing->hasVerifiedEmail())->toBeFalse();
});

it('returns a 404 for an unsupported social provider on callback', function () {
    $this->get(route('social.callback', ['provider' => 'twitter']))
        ->assertNotFound();
});

it('redirects authenticated users away from social login routes', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('social.redirect', ['provider' => 'google']))
        ->assertRedirect(route('home'));
});
