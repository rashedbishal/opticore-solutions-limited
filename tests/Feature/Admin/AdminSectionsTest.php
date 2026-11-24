<?php

use App\Models\Admin;
use App\Support\AdminPermissions;
use App\Support\AdminSections;
use Inertia\Testing\AssertableInertia as Assert;

it('places every grantable permission key in exactly one section', function () {
    $placed = collect(AdminSections::all())
        ->flatMap(fn (array $section) => array_column($section['modules'], 'key'));

    foreach (AdminPermissions::keys() as $key) {
        expect($placed->filter(fn ($placed) => $placed === $key)->count())->toBe(1, "{$key} must be in exactly one section");
    }

    expect($placed->duplicates()->all())->toBe([]);
});

it('shows the mother admin exactly three section cards on /admin', function () {
    $mother = Admin::factory()->create();

    $this->actingAs($mother, 'admin')
        ->get('/admin')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Home')
            ->has('sections', 3)
            ->where('sections.0.key', 'client-facing')
            ->where('sections.1.key', 'agency-operations')
            ->where('sections.2.key', 'management-administration')
        );
});

it('serves the existing dashboard from /admin/dashboard', function () {
    $mother = Admin::factory()->create();

    $this->actingAs($mother, 'admin')
        ->get('/admin/dashboard')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard'));
});

it('shows a regular admin only the sections they hold a role for', function () {
    $admin = Admin::factory()->regular()->create(['section_roles' => ['agency-operations']]);

    $this->actingAs($admin, 'admin')
        ->get('/admin')
        ->assertInertia(fn (Assert $page) => $page
            ->has('sections', 1)
            ->where('sections.0.key', 'agency-operations')
        );

    $this->actingAs($admin, 'admin')->get('/admin/sections/agency-operations')->assertSuccessful();
    $this->actingAs($admin, 'admin')->get('/admin/sections/client-facing')->assertForbidden();
    $this->actingAs($admin, 'admin')->get('/admin/sections/nope')->assertNotFound();
});

it('lists only the modules the admin may use, plus greyed planned ones', function () {
    $admin = Admin::factory()->regular()->create([
        'section_roles' => ['client-facing'],
        'permissions' => ['clients', 'blogs'],
    ]);

    $this->actingAs($admin, 'admin')
        ->get('/admin/sections/client-facing')
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Section')
            ->where('section.modules', fn ($modules) => collect($modules)->pluck('key')->all() === ['clients', 'blogs'])
            ->has('section.planned', 4)
        );
});

it('keeps legacy admins working: modules they hold imply their section', function () {
    $admin = Admin::factory()->withPermissions(['transactions'])->create();

    expect($admin->canAccessSection('management-administration'))->toBeTrue()
        ->and($admin->canAccessSection('client-facing'))->toBeFalse();
});

it('puts the dashboard in Management & Administration and mother-only tools only for the mother admin', function () {
    $mother = Admin::factory()->create();
    $regular = Admin::factory()->regular()->create(['section_roles' => ['management-administration']]);

    $keys = fn (Admin $admin) => collect(AdminSections::forAdmin($admin))
        ->firstWhere('key', 'management-administration')['modules'];

    expect(collect($keys($mother))->pluck('key')->all())->toContain('dashboard', 'pulse', 'storage-cleanup')
        ->and(collect($keys($regular))->pluck('key')->all())->toBe(['dashboard']);
});

it('stores section roles and implies the role of every granted module when the mother admin creates an admin', function () {
    $mother = Admin::factory()->create();

    $this->actingAs($mother, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'New Super Admin',
            'email' => 'new-super@example.com',
            'password' => 'password123',
            'section_roles' => ['client-facing'],
            'permissions' => ['clients', 'tasks'],
        ])
        ->assertRedirect(route('admin.users.index'));

    $created = Admin::where('email', 'new-super@example.com')->firstOrFail();

    expect($created->section_roles)->toBe(['client-facing', 'agency-operations'])
        ->and($created->permissions)->toBe(['clients', 'tasks']);
});

it('rejects an unknown section role', function () {
    $mother = Admin::factory()->create();

    $this->actingAs($mother, 'admin')
        ->post(route('admin.users.store'), [
            'name' => 'X',
            'email' => 'x@example.com',
            'password' => 'password123',
            'section_roles' => ['not-a-section'],
        ])
        ->assertSessionHasErrors('section_roles.0');
});

it('logs a regular admin out when the mother admin changes their section roles', function () {
    $mother = Admin::factory()->create();
    $admin = Admin::factory()->regular()->create(['section_roles' => ['client-facing']]);

    $before = $admin->securityStamp();
    $admin->update(['section_roles' => ['client-facing', 'agency-operations']]);

    expect($admin->securityStamp())->not->toBe($before);
});

it('sends a meal-management-only admin from /admin straight to their section', function () {
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($admin, 'admin')
        ->get('/admin')
        ->assertRedirect(route('admin.meal-management.index'));
});
