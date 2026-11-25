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

it('maps admin route names to the section whose sidebar is shown', function (?string $route, ?string $param, ?string $expected) {
    expect(AdminSections::sectionForRoute($route, $param))->toBe($expected);
})->with([
    'client module' => ['admin.orders.index', null, 'client-facing'],
    'leads module' => ['admin.leads.index', null, 'client-facing'],
    'lead set-up pages' => ['admin.lead-settings.index', null, 'client-facing'],
    'operations module' => ['admin.tasks.index', null, 'agency-operations'],
    'meal module' => ['admin.meal-management.index', null, 'agency-operations'],
    'dashboard' => ['admin.dashboard', null, 'management-administration'],
    'storage clean-up' => ['admin.storage-cleanup.index', null, 'management-administration'],
    'section page' => ['admin.sections.show', 'agency-operations', 'agency-operations'],
    'bad section param' => ['admin.sections.show', 'nope', null],
    'cards page' => ['admin.home', null, null],
    'non-admin route' => ['home', null, null],
    'no route' => [null, null, null],
]);

it('shares the active section so the sidebar shows one section only', function () {
    $mother = Admin::factory()->create();

    $this->actingAs($mother, 'admin')->get('/admin/orders')
        ->assertInertia(fn (Assert $page) => $page->where('activeSection', 'client-facing'));

    $this->actingAs($mother, 'admin')->get('/admin/tasks')
        ->assertInertia(fn (Assert $page) => $page->where('activeSection', 'agency-operations'));

    $this->actingAs($mother, 'admin')->get('/admin/dashboard')
        ->assertInertia(fn (Assert $page) => $page->where('activeSection', 'management-administration'));

    $this->actingAs($mother, 'admin')->get('/admin/sections/agency-operations')
        ->assertInertia(fn (Assert $page) => $page->where('activeSection', 'agency-operations'));

    $this->actingAs($mother, 'admin')->get('/admin')
        ->assertInertia(fn (Assert $page) => $page->where('activeSection', null));
});
