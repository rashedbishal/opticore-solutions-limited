<?php

use App\Leads\Enums\LeadRole;
use App\Models\Admin;
use Illuminate\Support\Facades\Auth;

it('lets the mother admin create an admin with a lead role', function () {
    $mother = Admin::factory()->create();

    $this->actingAs($mother, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'Agent Smith',
            'email' => 'agent@example.com',
            'password' => 'password123',
            'permissions' => ['blogs'],
            'lead_role' => 'agent',
        ])
        ->assertRedirect(route('admin.users.index'));

    $admin = Admin::where('email', 'agent@example.com')->firstOrFail();

    expect($admin->lead_role)->toBe(LeadRole::Agent)
        ->and($admin->permissions)->toBe(['blogs']);
});

it('keeps the lead role when the admin is given full access', function () {
    $mother = Admin::factory()->create();
    $admin = Admin::factory()->regular()->create();

    $this->actingAs($mother, 'admin')
        ->put(route('admin.users.update', $admin), [
            'name' => $admin->name,
            'email' => $admin->email,
            'full_access' => true,
            'permissions' => [],
            'lead_role' => 'manager',
        ])
        ->assertRedirect(route('admin.users.index'));

    expect($admin->fresh()->lead_role)->toBe(LeadRole::Manager)
        ->and($admin->fresh()->full_access)->toBeTrue();
});

it('removes the lead role when both boxes are unticked', function () {
    $mother = Admin::factory()->create();
    $admin = Admin::factory()->leadAgent()->create();

    $this->actingAs($mother, 'admin')
        ->put(route('admin.users.update', $admin), [
            'name' => $admin->name,
            'email' => $admin->email,
            'permissions' => [],
            'lead_role' => null,
        ]);

    expect($admin->fresh()->lead_role)->toBeNull();
});

it('rejects an unknown lead role', function () {
    $mother = Admin::factory()->create();

    $this->actingAs($mother, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'Someone',
            'email' => 'someone@example.com',
            'password' => 'password123',
            'lead_role' => 'owner',
        ])
        ->assertSessionHasErrors('lead_role');
});

it('ignores a lead role sent by an admin who is not the mother admin', function () {
    $manager = Admin::factory()->withPermissions(['users'])->create();
    $target = Admin::factory()->regular()->create();

    $this->actingAs($manager, 'admin')
        ->put(route('admin.users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'lead_role' => 'manager',
        ]);

    expect($target->fresh()->lead_role)->toBeNull();
});

it('never treats full access as a lead role, but always treats the mother admin as a manager', function () {
    expect(Admin::factory()->fullAccess()->create()->canUseLeads())->toBeFalse()
        ->and(Admin::factory()->create()->leadRole())->toBe(LeadRole::Manager)
        ->and(Admin::factory()->leadAgent()->create()->isLeadAgent())->toBeTrue()
        ->and(Admin::factory()->leadManager()->create()->isLeadManager())->toBeTrue();
});

it('logs an admin out when their lead role changes mid-session', function () {
    $admin = Admin::factory()->leadAgent()->create();
    $staleStamp = $admin->securityStamp();

    $admin->forceFill(['lead_role' => LeadRole::Manager])->save();

    $this->actingAs($admin->fresh(), 'admin')
        ->withSession(['admin_security_stamp' => $staleStamp])
        ->get(route('admin.dashboard'))
        ->assertRedirect(route('admin.login'));

    expect(Auth::guard('admin')->check())->toBeFalse();
});

it('does not count a meal-only admin with a lead role as meal-only', function () {
    $admin = Admin::factory()->withPermissions(['meal-management'])->withLeadRole(LeadRole::Agent)->create();

    expect($admin->isMealManagementOnly())->toBeFalse();
});
