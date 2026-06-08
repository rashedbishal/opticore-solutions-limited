<?php

use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

it('resets the password of the existing mother admin', function () {
    $mother = Admin::factory()->create(['email' => 'mother@example.com']);
    $oldHash = $mother->password;

    $this->artisan('admin:reset-mother-admin-credentials')
        ->expectsQuestion('Mother admin email', 'mother@example.com')
        ->expectsQuestion('New password', 'BrandNewSecure1!')
        ->expectsQuestion('Confirm password', 'BrandNewSecure1!')
        ->expectsOutputToContain('Resetting credentials for the existing mother admin')
        ->assertExitCode(0);

    $mother->refresh();
    expect($mother->password)->not->toBe($oldHash);
    expect(Hash::check('BrandNewSecure1!', $mother->password))->toBeTrue();
    expect($mother->is_super_admin)->toBeTrue();
    expect($mother->full_access)->toBeTrue();
});

it('creates a new mother admin account when no admin has the given email', function () {
    expect(Admin::where('email', 'newmother@example.com')->exists())->toBeFalse();

    $this->artisan('admin:reset-mother-admin-credentials')
        ->expectsQuestion('Mother admin email', 'newmother@example.com')
        ->expectsQuestion('New password', 'BrandNewSecure1!')
        ->expectsQuestion('Confirm password', 'BrandNewSecure1!')
        ->expectsQuestion('Name for the new mother admin account', 'New Mother')
        ->expectsOutputToContain('Creating a new mother admin account')
        ->assertExitCode(0);

    $admin = Admin::where('email', 'newmother@example.com')->first();
    expect($admin)->not->toBeNull();
    expect($admin->name)->toBe('New Mother');
    expect($admin->is_super_admin)->toBeTrue();
    expect($admin->full_access)->toBeTrue();
    expect(Hash::check('BrandNewSecure1!', $admin->password))->toBeTrue();
});

it('promotes a regular admin to mother admin when the operator confirms', function () {
    $regular = Admin::factory()->withPermissions(['blogs'])->create(['email' => 'regular@example.com']);

    $this->artisan('admin:reset-mother-admin-credentials')
        ->expectsQuestion('Mother admin email', 'regular@example.com')
        ->expectsQuestion('New password', 'BrandNewSecure1!')
        ->expectsQuestion('Confirm password', 'BrandNewSecure1!')
        ->expectsConfirmation(
            "'{$regular->name}' (regular@example.com) is currently a regular admin. Promote them to mother admin and reset their password?",
            'yes'
        )
        ->assertExitCode(0);

    $regular->refresh();
    expect($regular->is_super_admin)->toBeTrue();
    expect($regular->full_access)->toBeTrue();
    expect(Hash::check('BrandNewSecure1!', $regular->password))->toBeTrue();
});

it('aborts without changes when the operator declines the promotion', function () {
    $regular = Admin::factory()->withPermissions(['blogs'])->create(['email' => 'regular@example.com']);
    $oldHash = $regular->password;

    $this->artisan('admin:reset-mother-admin-credentials')
        ->expectsQuestion('Mother admin email', 'regular@example.com')
        ->expectsQuestion('New password', 'BrandNewSecure1!')
        ->expectsQuestion('Confirm password', 'BrandNewSecure1!')
        ->expectsConfirmation(
            "'{$regular->name}' (regular@example.com) is currently a regular admin. Promote them to mother admin and reset their password?",
            'no'
        )
        ->expectsOutputToContain('Aborted')
        ->assertExitCode(1);

    $regular->refresh();
    expect($regular->is_super_admin)->toBeFalse();
    expect($regular->password)->toBe($oldHash);
});

it('demotes the previous mother admin once the operator confirms', function () {
    $oldMother = Admin::factory()->create(['email' => 'old-mother@example.com']);

    $this->artisan('admin:reset-mother-admin-credentials')
        ->expectsQuestion('Mother admin email', 'new-mother@example.com')
        ->expectsQuestion('New password', 'BrandNewSecure1!')
        ->expectsQuestion('Confirm password', 'BrandNewSecure1!')
        ->expectsQuestion('Name for the new mother admin account', 'New Mother')
        ->expectsConfirmation(
            "'{$oldMother->name}' (old-mother@example.com) is also currently a mother admin. Demote them to a regular admin with no access?",
            'yes'
        )
        ->assertExitCode(0);

    $oldMother->refresh();
    expect($oldMother->is_super_admin)->toBeFalse();
    expect($oldMother->full_access)->toBeFalse();

    $newMother = Admin::where('email', 'new-mother@example.com')->first();
    expect($newMother->is_super_admin)->toBeTrue();
});

it('leaves the previous mother admin untouched when the operator declines the demotion', function () {
    $oldMother = Admin::factory()->create(['email' => 'old-mother@example.com']);

    $this->artisan('admin:reset-mother-admin-credentials')
        ->expectsQuestion('Mother admin email', 'new-mother@example.com')
        ->expectsQuestion('New password', 'BrandNewSecure1!')
        ->expectsQuestion('Confirm password', 'BrandNewSecure1!')
        ->expectsQuestion('Name for the new mother admin account', 'New Mother')
        ->expectsConfirmation(
            "'{$oldMother->name}' (old-mother@example.com) is also currently a mother admin. Demote them to a regular admin with no access?",
            'no'
        )
        ->expectsOutputToContain('the system now has more than one')
        ->assertExitCode(0);

    $oldMother->refresh();
    expect($oldMother->is_super_admin)->toBeTrue();
});
