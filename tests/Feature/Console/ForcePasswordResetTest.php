<?php

use App\Models\Admin;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('does nothing on a dry run', function () {
    $user = User::factory()->create(['password' => Hash::make('known-password')]);
    $oldHash = $user->password;

    $this->artisan('auth:force-password-reset --dry-run')
        ->expectsOutputToContain('Dry run')
        ->assertExitCode(0);

    expect($user->fresh()->password)->toBe($oldHash);
});

it('aborts without confirmation and without --force', function () {
    $user = User::factory()->create(['password' => Hash::make('known-password')]);
    $oldHash = $user->password;

    $this->artisan('auth:force-password-reset')
        ->expectsConfirmation('Are you sure you want to continue?', 'no')
        ->expectsOutputToContain('Aborted')
        ->assertExitCode(0);

    expect($user->fresh()->password)->toBe($oldHash);
});

it('invalidates every user and admin password with --force', function () {
    $user = User::factory()->create(['password' => Hash::make('known-user-password')]);
    $admin = Admin::factory()->create(['password' => Hash::make('known-admin-password')]);

    $this->artisan('auth:force-password-reset --force')->assertExitCode(0);

    $user->refresh();
    $admin->refresh();

    expect($user->password)->toStartWith('$argon2id$');
    expect(Hash::check('known-user-password', $user->password))->toBeFalse();

    expect($admin->password)->toStartWith('$argon2id$');
    expect(Hash::check('known-admin-password', $admin->password))->toBeFalse();
});

it('gives every account a different random password, not a shared one', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    $this->artisan('auth:force-password-reset --force')->assertExitCode(0);

    expect($userA->fresh()->password)->not->toBe($userB->fresh()->password);
});
