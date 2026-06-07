<?php

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

it('shows the verification notice to an unverified user', function () {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->get(route('verification.notice'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Auth/VerifyEmail'));
});

it('redirects an already-verified user away from the verification notice', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('verification.notice'))
        ->assertRedirect('/');
});

it('verifies the email when visiting a valid signed verification link', function () {
    Event::fake([Verified::class]);

    $user = User::factory()->unverified()->create();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)]
    );

    $this->actingAs($user)
        ->get($verificationUrl)
        ->assertRedirect('/?verified=1');

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();

    Event::assertDispatched(Verified::class);
});

it('rejects an invalid verification hash', function () {
    $user = User::factory()->unverified()->create();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1('wrong-email@example.com')]
    );

    $this->actingAs($user)->get($verificationUrl)->assertForbidden();

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('rejects an unsigned verification link', function () {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->get(route('verification.verify', ['id' => $user->id, 'hash' => sha1($user->email)]))
        ->assertForbidden();

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('does not redispatch the verified event for an already-verified user', function () {
    Event::fake([Verified::class]);

    $user = User::factory()->create();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)]
    );

    $this->actingAs($user)
        ->get($verificationUrl)
        ->assertRedirect('/');

    Event::assertNotDispatched(Verified::class);
});

it('resends the verification email for an unverified user', function () {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->post(route('verification.send'))
        ->assertRedirect()
        ->assertSessionHas('status', 'verification-link-sent');
});

it('does not resend the verification email for an already-verified user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('verification.send'))
        ->assertRedirect('/');
});

it('blocks guests from accessing email verification routes', function () {
    $user = User::factory()->unverified()->create();

    $this->get(route('verification.notice'))->assertRedirect(route('login'));
    $this->post(route('verification.send'))->assertRedirect(route('login'));

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)]
    );
    $this->get($verificationUrl)->assertRedirect(route('login'));
});
