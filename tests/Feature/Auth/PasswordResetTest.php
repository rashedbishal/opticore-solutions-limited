<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the forgot password page', function () {
    $this->get(route('password.request'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Auth/ForgotPassword'));
});

it('sends a reset link notification for a known email', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post(route('password.email'), ['email' => $user->email])
        ->assertRedirect()
        ->assertSessionHas('status');

    Notification::assertSentTo($user, ResetPassword::class);
});

it('responds identically for an unknown email as for a known one, to avoid leaking which emails are registered', function () {
    Notification::fake();

    $known = User::factory()->create();
    $expectedStatus = 'If an account exists for that email address, we have emailed a password reset link.';

    $this->post(route('password.email'), ['email' => $known->email])
        ->assertRedirect()
        ->assertSessionHas('status', $expectedStatus);

    $this->post(route('password.email'), ['email' => 'nobody@example.com'])
        ->assertRedirect()
        ->assertSessionHas('status', $expectedStatus)
        ->assertSessionDoesntHaveErrors('email');

    Notification::assertSentTo($known, ResetPassword::class);
    Notification::assertSentTimes(ResetPassword::class, 1);
});

it('rate limits repeated reset requests aimed at the same email', function () {
    Notification::fake();

    $user = User::factory()->create();

    foreach (range(1, 3) as $_) {
        $this->post(route('password.email'), ['email' => $user->email])
            ->assertStatus(302);
    }

    $this->post(route('password.email'), ['email' => $user->email])
        ->assertStatus(429);
});

it('rate limits reset requests across many different emails from one source', function () {
    Notification::fake();

    foreach (range(1, 10) as $i) {
        $this->post(route('password.email'), ['email' => "enumerate-{$i}@example.com"])
            ->assertStatus(302);
    }

    $this->post(route('password.email'), ['email' => 'enumerate-11@example.com'])
        ->assertStatus(429);
});

it('rate limits repeated reset submissions aimed at the same email', function () {
    $user = User::factory()->create();

    foreach (range(1, 3) as $_) {
        $this->post(route('password.update'), [
            'token' => 'invalid-token',
            'email' => $user->email,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertStatus(302);
    }

    $this->post(route('password.update'), [
        'token' => 'invalid-token',
        'email' => $user->email,
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ])->assertStatus(429);

    expect(Hash::check('NewPassword123!', $user->fresh()->password))->toBeFalse();
});

it('requires a valid email to request a reset link', function () {
    $this->post(route('password.email'), [])->assertInvalid(['email']);

    $this->post(route('password.email'), ['email' => 'not-an-email'])->assertInvalid(['email']);
});

it('renders the reset password page with the token and email', function () {
    $this->get(route('password.reset', ['token' => 'sample-token', 'email' => 'jane@example.com']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Auth/ResetPassword')
            ->where('token', 'sample-token')
        );
});

it('resets the password with a valid token', function () {
    Notification::fake();

    $user = User::factory()->create();

    Password::sendResetLink(['email' => $user->email]);

    $token = null;
    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token) {
        $token = $notification->token;

        return true;
    });

    $this->post(route('password.update'), [
        'token' => $token,
        'email' => $user->email,
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ])->assertRedirect(route('login'))
        ->assertSessionHas('status');

    expect(Hash::check('NewPassword123!', $user->fresh()->password))->toBeTrue();
});

it('rejects a reset attempt with an invalid token', function () {
    $user = User::factory()->create();

    $this->post(route('password.update'), [
        'token' => 'invalid-token',
        'email' => $user->email,
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ])->assertSessionHasErrors('email');

    expect(Hash::check('NewPassword123!', $user->fresh()->password))->toBeFalse();
});

it('requires token, email, and a confirmed password to reset', function () {
    $this->post(route('password.update'), [])
        ->assertInvalid(['token', 'email', 'password']);
});

it('rejects a reset when password confirmation does not match', function () {
    $user = User::factory()->create();

    $this->post(route('password.update'), [
        'token' => 'some-token',
        'email' => $user->email,
        'password' => 'NewPassword123!',
        'password_confirmation' => 'Different123!',
    ])->assertInvalid(['password']);
});

it('blocks authenticated users from forgot/reset password routes', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('password.request'))->assertRedirect(route('home'));
    $this->actingAs($user)->get(route('password.reset', ['token' => 'abc']))->assertRedirect(route('home'));
});
