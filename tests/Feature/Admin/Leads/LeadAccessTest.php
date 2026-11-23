<?php

use App\Models\Admin;
use Illuminate\Support\Facades\Broadcast;

dataset('lead users', [
    'mother admin' => fn () => Admin::factory()->create(),
    'lead manager' => fn () => Admin::factory()->leadManager()->create(),
    'lead agent' => fn () => Admin::factory()->leadAgent()->create(),
]);

dataset('admins without a lead role', [
    'regular admin' => fn () => Admin::factory()->regular()->create(),
    'full-access admin' => fn () => Admin::factory()->fullAccess()->create(),
]);

it('lets anyone with a lead role use lead pages', function (Admin $admin) {
    $this->actingAs($admin, 'admin')
        ->getJson(route('admin.leads.notifications.index'))
        ->assertOk();
})->with('lead users');

it('blocks admins without a lead role from lead pages', function (Admin $admin) {
    $this->actingAs($admin, 'admin')
        ->getJson(route('admin.leads.notifications.index'))
        ->assertForbidden();
})->with('admins without a lead role');

it('lets the mother admin open lead settings', function () {
    $this->actingAs(Admin::factory()->create(), 'admin')
        ->get(route('admin.lead-settings.statuses.index'))
        ->assertOk();
});

it('blocks everyone else from lead settings, even lead managers and full-access admins', function (string $route) {
    foreach (['lead manager' => Admin::factory()->leadManager(), 'full access' => Admin::factory()->fullAccess()] as $factory) {
        $this->actingAs($factory->create(), 'admin')
            ->get(route($route))
            ->assertForbidden();

        $this->flushSession();
    }
})->with(['admin.lead-settings.statuses.index', 'admin.lead-settings.currencies.index']);

it('lets an admin join only their own lead alerts channel, and only with a lead role', function () {
    $callback = Broadcast::getChannels()->get('admin.lead-notifications.{adminId}');
    $agent = Admin::factory()->leadAgent()->create();
    $other = Admin::factory()->leadAgent()->create();
    $noRole = Admin::factory()->fullAccess()->create();

    expect($callback($agent, $agent->id))->toBeTrue()
        ->and($callback($agent, $other->id))->toBeFalse()
        ->and($callback($noRole, $noRole->id))->toBeFalse();
});
