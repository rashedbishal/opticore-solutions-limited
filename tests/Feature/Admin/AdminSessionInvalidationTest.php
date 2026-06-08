<?php

use App\Models\Admin;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

it('seeds the security stamp into a fresh session on first request', function () {
    $admin = Admin::factory()->withPermissions(['blogs'])->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertSuccessful();

    expect(session('admin_security_stamp'))->toBe($admin->securityStamp());
});

it('keeps a regular admin logged in while their account is unchanged', function () {
    $admin = Admin::factory()->withPermissions(['blogs'])->create();

    $this->actingAs($admin, 'admin')
        ->withSession(['admin_security_stamp' => $admin->securityStamp()])
        ->get(route('admin.dashboard'))
        ->assertSuccessful();

    expect(Auth::guard('admin')->check())->toBeTrue();
});

it('logs out a regular admin immediately when their password changes mid-session', function () {
    $admin = Admin::factory()->withPermissions(['blogs'])->create();
    $staleStamp = $admin->securityStamp();

    $admin->forceFill(['password' => Hash::make('BrandNewSecure1!')])->save();

    $response = $this->actingAs($admin->fresh(), 'admin')
        ->withSession(['admin_security_stamp' => $staleStamp])
        ->get(route('admin.dashboard'));

    $response->assertRedirect(route('admin.login'));
    $response->assertSessionHas('error');
    expect(Auth::guard('admin')->check())->toBeFalse();
});

it('logs out a regular admin immediately when their permissions change mid-session', function () {
    $admin = Admin::factory()->withPermissions(['blogs'])->create();
    $staleStamp = $admin->securityStamp();

    $admin->forceFill(['permissions' => ['blogs', 'faqs']])->save();

    $response = $this->actingAs($admin->fresh(), 'admin')
        ->withSession(['admin_security_stamp' => $staleStamp])
        ->get(route('admin.dashboard'));

    $response->assertRedirect(route('admin.login'));
    expect(Auth::guard('admin')->check())->toBeFalse();
});

it('logs out a regular admin immediately when full access is granted mid-session', function () {
    $admin = Admin::factory()->withPermissions(['blogs'])->create();
    $staleStamp = $admin->securityStamp();

    $admin->forceFill(['full_access' => true, 'permissions' => []])->save();

    $response = $this->actingAs($admin->fresh(), 'admin')
        ->withSession(['admin_security_stamp' => $staleStamp])
        ->get(route('admin.dashboard'));

    $response->assertRedirect(route('admin.login'));
    expect(Auth::guard('admin')->check())->toBeFalse();
});

it('does not log out the mother admin when they change their own password', function () {
    $mother = Admin::factory()->create();
    $staleStamp = $mother->securityStamp();

    $mother->forceFill(['password' => Hash::make('BrandNewSecure1!')])->save();

    $response = $this->actingAs($mother->fresh(), 'admin')
        ->withSession(['admin_security_stamp' => $staleStamp])
        ->get(route('admin.dashboard'));

    $response->assertSuccessful();
    expect(Auth::guard('admin')->check())->toBeTrue();
});

it('logs out an admin whose account is deleted mid-session', function () {
    $admin = Admin::factory()->withPermissions(['blogs'])->create([
        'password' => Hash::make('OriginalSecure1!'),
    ]);

    $this->post(route('admin.login'), [
        'email' => $admin->email,
        'password' => 'OriginalSecure1!',
    ])->assertSuccessful();

    $admin->delete();

    // Force the guard to forget its cached user instance so the next
    // request re-resolves the (now-deleted) admin from the session ID,
    // faithfully reproducing what happens on a real subsequent request.
    Auth::forgetGuards();

    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('admin.login'));

    expect(Auth::guard('admin')->check())->toBeFalse();
});
