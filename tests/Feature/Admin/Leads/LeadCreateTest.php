<?php

use App\Leads\Enums\AutoDistributionMethod;
use App\Leads\Enums\LeadDistributionMode;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSetting;
use App\Leads\Models\LeadStatus;
use App\Leads\Notifications\LeadAssignedNotification;
use App\Leads\Notifications\MeetingUpdatedNotification;
use App\Leads\Notifications\NewLeadNotification;
use App\Leads\Support\LeadClock;
use App\Models\Admin;
use Illuminate\Support\Facades\Notification;

function leadPayload(array $overrides = []): array
{
    return [
        'name' => 'Jane Doe',
        'phone' => '+8801711000000',
        'email' => 'jane@example.com',
        'status_id' => LeadStatus::initial()->id,
        'priority' => 'high',
        ...$overrides,
    ];
}

it('lets a manager add a lead for someone, who is told it was assigned to them', function () {
    Notification::fake();
    $manager = Admin::factory()->leadManager()->create();
    $agent = Admin::factory()->leadAgent()->create();

    $this->actingAs($manager, 'admin')
        ->post(route('admin.leads.store'), leadPayload(['assigned_to' => $agent->id]))
        ->assertSessionHasNoErrors();

    $lead = Lead::firstOrFail();

    expect($lead->assigned_to)->toBe($agent->id)
        ->and($lead->identifier)->toBe('OCS-LEAD-1')
        ->and($lead->priority->value)->toBe('high');

    Notification::assertSentTo($agent, LeadAssignedNotification::class);
    Notification::assertNotSentTo($manager, NewLeadNotification::class);
});

it('always gives a lead an agent adds to that agent', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $someoneElse = Admin::factory()->leadAgent()->create();

    $this->actingAs($agent, 'admin')
        ->post(route('admin.leads.store'), leadPayload(['assigned_to' => $someoneElse->id]))
        ->assertSessionHasNoErrors();

    expect(Lead::firstOrFail()->assigned_to)->toBe($agent->id);
});

it('numbers leads one after another and requires a phone number', function () {
    $manager = Admin::factory()->leadManager()->create();

    $this->actingAs($manager, 'admin')->post(route('admin.leads.store'), leadPayload());
    $this->actingAs($manager, 'admin')->post(route('admin.leads.store'), leadPayload(['name' => 'John Roe']));
    $this->actingAs($manager, 'admin')
        ->post(route('admin.leads.store'), leadPayload(['phone' => '']))
        ->assertSessionHasErrors('phone');

    expect(Lead::orderBy('identifier')->pluck('identifier')->all())->toBe(['OCS-LEAD-1', 'OCS-LEAD-2']);
});

it('tells the other managers when a new lead comes with a meeting', function () {
    Notification::fake();
    $manager = Admin::factory()->leadManager()->create();
    $otherManager = Admin::factory()->leadManager()->create();

    $this->actingAs($manager, 'admin')
        ->post(route('admin.leads.store'), leadPayload(['meeting_at' => LeadClock::today()->addDays(2)->format('Y-m-d').'T10:30']))
        ->assertSessionHasNoErrors();

    Notification::assertSentTo($otherManager, MeetingUpdatedNotification::class);
    Notification::assertNotSentTo($manager, MeetingUpdatedNotification::class);
    expect(Lead::firstOrFail()->meetingTimeFormatted())->toBe('10:30 AM');
});

it('refuses a meeting in the past (Bangladesh time)', function () {
    $manager = Admin::factory()->leadManager()->create();

    $this->actingAs($manager, 'admin')
        ->post(route('admin.leads.store'), leadPayload(['meeting_at' => LeadClock::today()->subDay()->format('Y-m-d').'T10:00']))
        ->assertSessionHasErrors('meeting_at');
});

it('hands an unowned manual lead to an agent when automatic distribution is on', function () {
    LeadSetting::current()->update(['distribution_mode' => LeadDistributionMode::Automatic, 'auto_distribution_method' => AutoDistributionMethod::RoundRobin]);
    $manager = Admin::factory()->leadManager()->create();
    $agent = Admin::factory()->leadAgent()->create();

    $this->actingAs($manager, 'admin')->post(route('admin.leads.store'), leadPayload());

    expect(Lead::firstOrFail()->assigned_to)->toBe($agent->id);
});
