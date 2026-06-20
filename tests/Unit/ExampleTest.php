<?php

use App\Models\User;

it('identifies an admin user by role', function () {
    $user = (new User)->forceFill(['role' => 'admin']);
    expect($user->isAdmin())->toBeTrue();
});

it('identifies a regular user as non-admin', function () {
    $user = (new User)->forceFill(['role' => 'client']);
    expect($user->isAdmin())->toBeFalse();
});

it('treats a user with no role as non-admin', function () {
    $user = new User([]);
    expect($user->isAdmin())->toBeFalse();
});
