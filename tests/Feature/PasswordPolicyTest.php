<?php

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

// Registration, self-service password reset, profile password changes, and
// the mother-admin break-glass command all validate against this one shared
// Password::defaults() rule (AppServiceProvider::configureDefaults()) —
// testing it here covers all of them without duplicating HTTP-level tests
// per call site, and without needing a real production HTTP round trip
// (which also flips session.secure and would break CSRF over the test
// client's non-HTTPS transport).
it('enforces min 8 chars, letters, numbers, mixed case, and a symbol in production', function () {
    $this->app['env'] = 'production';

    $rules = ['password' => ['required', Password::defaults()]];

    expect(Validator::make(['password' => 'Sh1!'], $rules)->fails())
        ->toBeTrue('too short');
    expect(Validator::make(['password' => 'password1!'], $rules)->fails())
        ->toBeTrue('no uppercase letter');
    expect(Validator::make(['password' => 'PASSWORD1!'], $rules)->fails())
        ->toBeTrue('no lowercase letter');
    expect(Validator::make(['password' => 'Password!'], $rules)->fails())
        ->toBeTrue('no number');
    expect(Validator::make(['password' => 'Password1'], $rules)->fails())
        ->toBeTrue('no symbol');

    expect(Validator::make(['password' => 'Password1!'], $rules)->fails())
        ->toBeFalse();
});

it('does not enforce the strong policy outside production', function () {
    expect(app()->isProduction())->toBeFalse();

    $rules = ['password' => ['required', Password::defaults()]];

    expect(Validator::make(['password' => 'password'], $rules)->fails())
        ->toBeFalse();
});
