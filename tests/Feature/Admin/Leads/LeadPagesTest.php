<?php

use App\Leads\Enums\LeadDistributionMode;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSetting;
use App\Leads\Notifications\LeadAssignedNotification;
use App\Models\Admin;
use Illuminate\Support\Facades\Broadcast;
use Inertia\Testing\AssertableInertia as Assert;

it('lets the mother admin change the general lead settings', function () {
    $mother = Admin::factory()->create();

    $this->actingAs($mother, 'admin')
        ->put(route('admin.lead-settings.general.update'), [
            'distribution_mode' => 'automatic',
            'auto_distribution_method' => null,
            'lead_id_prefix' => 'ocs',
            'meeting_alert_enabled' => true,
            'meeting_alert_days_before' => 1,
            'followup_alert_enabled' => false,
            'followup_alert_days_before' => 0,
        ])
        ->assertSessionHasErrors('auto_distribution_method');

    $this->actingAs($mother, 'admin')
        ->put(route('admin.lead-settings.general.update'), [
            'distribution_mode' => 'automatic',
            'auto_distribution_method' => 'least_loaded',
            'lead_id_prefix' => 'opt',
            'meeting_alert_enabled' => true,
            'meeting_alert_days_before' => 1,
            'followup_alert_enabled' => false,
            'followup_alert_days_before' => 0,
            'task_alert_enabled' => true,
            'task_alert_days_before' => 2,
            'nurturing_notify_enabled' => false,
            'nurturing_task_enabled' => false,
            'nurturing_inactive_days' => 7,
        ])
        ->assertSessionHasNoErrors();

    $settings = LeadSetting::current();

    expect($settings->distribution_mode)->toBe(LeadDistributionMode::Automatic)
        ->and($settings->lead_id_prefix)->toBe('OPT')
        ->and(Lead::factory()->create()->identifier)->toBe('OPT-LEAD-1');
});

it('keeps general lead settings mother-admin-only', function () {
    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->get(route('admin.lead-settings.general.edit'))
        ->assertForbidden();
});

it('shows lead sources to managers only, without credentials', function () {
    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')
        ->get(route('admin.leads.sources.index'))
        ->assertForbidden();

    $this->flushSession();

    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->get(route('admin.leads.sources.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Leads/Sources')
            ->has('sources', 3)
            ->missing('sources.0.config'));
});

it('words lead alerts like OptiFin and only links to leads the viewer can open', function () {
    $manager = Admin::factory()->leadManager()->create(['name' => 'Rahim']);
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->create(['name' => 'Jane Doe']);

    $agent->notify(new LeadAssignedNotification($lead, $manager->name));

    $this->actingAs($agent, 'admin')
        ->getJson(route('admin.leads.notifications.index'))
        ->assertJsonPath('notifications.0.title', 'Rahim assigned you a lead')
        ->assertJsonPath('notifications.0.message', 'Jane Doe');

    // The lead isn't the agent's (still unowned), so opening goes to the dashboard.
    $this->actingAs($agent, 'admin')
        ->get(route('admin.leads.notifications.open', $agent->notifications()->first()->id))
        ->assertRedirect(route('admin.dashboard'));
});

it('lets only admins with a lead role join the live leads channel', function () {
    $callback = Broadcast::getChannels()->get('admin.leads');

    expect($callback(Admin::factory()->leadAgent()->create()))->toBeTrue()
        ->and($callback(Admin::factory()->fullAccess()->create()))->toBeFalse();
});
