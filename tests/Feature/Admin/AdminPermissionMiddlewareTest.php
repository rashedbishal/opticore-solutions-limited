<?php

use App\Models\Admin;
use Inertia\Testing\AssertableInertia as Assert;

it('always allows the dashboard regardless of permissions', function () {
    $admin = Admin::factory()->regular()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertSuccessful();
});

it('allows a regular admin to access only the sections they are granted', function () {
    $admin = Admin::factory()->withPermissions(['blogs'])->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.blogs.index'))
        ->assertSuccessful();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.portfolios.index'))
        ->assertForbidden()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Error')
            ->where('status', 403)
        );
});

it('grants access to every section when full access is enabled', function () {
    $admin = Admin::factory()->fullAccess()->create();

    $this->actingAs($admin, 'admin')->get(route('admin.brands.index'))->assertSuccessful();
    $this->actingAs($admin, 'admin')->get(route('admin.testimonials.index'))->assertSuccessful();
    $this->actingAs($admin, 'admin')->get(route('admin.faqs.index'))->assertSuccessful();
});

it('grants the mother admin access to every section regardless of permissions', function () {
    $mother = Admin::factory()->create();

    $this->actingAs($mother, 'admin')->get(route('admin.brands.index'))->assertSuccessful();
    $this->actingAs($mother, 'admin')->get(route('admin.testimonials.index'))->assertSuccessful();
    $this->actingAs($mother, 'admin')->get(route('admin.users.index'))->assertSuccessful();
});

it('blocks a regular admin with no permissions from any non-dashboard section, including the admins page', function () {
    $admin = Admin::factory()->regular()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.blogs.index'))
        ->assertForbidden();

    // The "Admins" section is gated like any other sidebar section — the
    // mother admin must explicitly grant the `users` permission key.
    $this->actingAs($admin, 'admin')
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

it('lets a regular admin granted the users permission manage other admins passwords', function () {
    $admin = Admin::factory()->withPermissions(['users'])->create();
    $other = Admin::factory()->regular()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.users.index'))
        ->assertSuccessful();

    $this->actingAs($admin, 'admin')
        ->put(route('admin.users.update', $other), [
            'password' => 'BrandNewSecure1!',
        ])
        ->assertRedirect(route('admin.users.index'));
});
