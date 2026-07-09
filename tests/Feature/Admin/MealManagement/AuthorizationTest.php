<?php

use App\Models\Admin;

/**
 * Verifies the meal-management section is gated by the 'meal-management'
 * permission key exactly like every other CMS section, and that
 * mother-admin-only actions inside it stay locked down even for an admin
 * who holds that permission. See tests/Feature/Admin/AdminAuthorizationTest.php
 * for the sibling pattern this mirrors.
 */
it('blocks guests from the meal-management section', function () {
    $this->get(route('admin.meal-management.index'))->assertRedirect(route('admin.login'));
});

it('blocks a regular admin without the meal-management permission', function () {
    $admin = Admin::factory()->regular()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.meal-management.index'))
        ->assertForbidden();

    $this->actingAs($admin, 'admin')
        ->post(route('admin.meal-management.select'), ['status' => 'accepted'])
        ->assertForbidden();
});

it('lets an admin with the meal-management permission reach the section', function () {
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.meal-management.index'))
        ->assertOk();
});

it('redirects an admin whose only permission is meal-management away from the dashboard', function () {
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($admin, 'admin')
        ->get('/admin')
        ->assertRedirect(route('admin.meal-management.index'));
});

it('does not redirect an admin who holds meal-management alongside other permissions', function () {
    $admin = Admin::factory()->withPermissions(['meal-management', 'blogs'])->create();

    $this->actingAs($admin, 'admin')
        ->get('/admin')
        ->assertOk();
});

it('forbids a regular admin with the permission from mother-admin-only actions', function () {
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($admin, 'admin')
        ->put(route('admin.meal-management.settings.update'), [
            'accept_start_time' => '08:00',
            'lock_time' => '11:30',
            'weekly_holiday_day' => 5,
        ])
        ->assertForbidden();

    $this->actingAs($admin, 'admin')
        ->put(route('admin.meal-management.item.update'), ['item_name' => 'Biryani'])
        ->assertForbidden();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.meal-management.report.export', ['month' => now()->format('Y-m')]))
        ->assertForbidden();
});

it('forbids the mother admin from selecting her own lunch', function () {
    $motherAdmin = Admin::factory()->create();

    $this->actingAs($motherAdmin, 'admin')
        ->post(route('admin.meal-management.select'), ['status' => 'accepted'])
        ->assertForbidden();
});
