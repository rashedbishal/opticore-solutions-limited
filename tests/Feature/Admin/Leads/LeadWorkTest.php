<?php

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Currency;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadDeletionAudit;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadStatus;
use App\Leads\Models\LeadStatusLog;
use App\Leads\Notifications\FollowUpCancelledNotification;
use App\Leads\Notifications\LeadAssignedNotification;
use App\Leads\Notifications\MeetingUpdatedNotification;
use App\Leads\Support\LeadClock;
use App\Models\Admin;
use Illuminate\Support\Facades\Notification;

function status(string $slug): LeadStatus
{
    return LeadStatus::where('slug', $slug)->firstOrFail();
}

it('moves a lead between statuses: first contact, closing and re-opening', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->assignedTo($agent)->create();

    $this->actingAs($agent, 'admin')->put(route('admin.leads.status', $lead), ['status_id' => status('contacted')->id]);
    $lead->refresh();
    expect($lead->first_contacted_at)->not->toBeNull()->and($lead->closed_at)->toBeNull();

    $this->actingAs($agent, 'admin')->put(route('admin.leads.status', $lead), ['status_id' => status('won')->id]);
    expect($lead->fresh()->closed_at)->not->toBeNull();

    $this->actingAs($agent, 'admin')->put(route('admin.leads.status', $lead), ['status_id' => status('negotiation')->id]);
    expect($lead->fresh()->closed_at)->toBeNull()
        ->and(LeadStatusLog::where('lead_id', $lead->id)->count())->toBe(3)
        ->and(LeadStatusLog::latest('id')->first()->changed_by_name)->toBe($agent->name);
});

it('records priority changes in the history', function () {
    $manager = Admin::factory()->leadManager()->create();
    $lead = Lead::factory()->create();

    $this->actingAs($manager, 'admin')->put(route('admin.leads.status', $lead), ['priority' => 'urgent']);

    expect($lead->fresh()->priority->value)->toBe('urgent')
        ->and($lead->detailUpdateLogs()->first()->changed_fields)->toBe(['priority']);
});

it('edits contact, company and deal details with OptiFin\'s validation', function () {
    $manager = Admin::factory()->leadManager()->create();
    $lead = Lead::factory()->create();
    $usd = Currency::where('code', 'USD')->firstOrFail();

    $this->actingAs($manager, 'admin')
        ->put(route('admin.leads.contact', $lead), ['name' => 'Jane 123', 'phone' => '12'])
        ->assertSessionHasErrors(['name', 'phone']);

    $this->actingAs($manager, 'admin')
        ->put(route('admin.leads.company', $lead), ['company' => 'Acme Ltd.', 'website' => 'https://acme.test', 'industry' => 'Retail', 'location' => 'Dhaka'])
        ->assertSessionHasNoErrors();

    $this->actingAs($manager, 'admin')
        ->put(route('admin.leads.deal', $lead), ['deal_value' => '1500.50', 'deal_value_currency_id' => $usd->id, 'win_probability' => 60, 'estimated_budget_currency_id' => $usd->id])
        ->assertSessionHasNoErrors();

    $lead->refresh();

    expect($lead->company)->toBe('Acme Ltd.')
        ->and((string) $lead->deal_value)->toBe('1500.50')
        ->and($lead->deal_value_currency_id)->toBe($usd->id)
        // a currency without an amount is dropped
        ->and($lead->estimated_budget_currency_id)->toBeNull()
        ->and($usd->isInUse())->toBeTrue();
});

it('only lets the free-text lead source be edited on leads added by hand', function () {
    $manager = Admin::factory()->leadManager()->create();
    $formLead = Lead::factory()->fromSource(LeadSource::ofType(LeadSourceType::ContactForm))->create();

    $this->actingAs($manager, 'admin')->put(route('admin.leads.deal', $formLead), ['lead_source' => 'Referral']);

    expect($formLead->fresh()->lead_source)->toBeNull();
});

it('tells the other managers when a meeting is rescheduled', function () {
    Notification::fake();
    $manager = Admin::factory()->leadManager()->create();
    $other = Admin::factory()->leadManager()->create();
    $lead = Lead::factory()->create(['meeting_date' => LeadClock::today()->addDay()->toDateString()]);

    $this->actingAs($manager, 'admin')
        ->put(route('admin.leads.deal', $lead), ['meeting_at' => LeadClock::today()->addDays(3)->format('Y-m-d').'T15:00']);

    Notification::assertSentTo($other, MeetingUpdatedNotification::class, fn ($n) => $n->rescheduled === true);
});

it('lets only managers assign, and alerts the new owner', function () {
    Notification::fake();
    $manager = Admin::factory()->leadManager()->create();
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->assignedTo($agent)->create();

    $this->actingAs($agent, 'admin')
        ->put(route('admin.leads.assign', $lead), ['assigned_to' => null])
        ->assertForbidden();

    $this->flushSession();
    $target = Admin::factory()->leadAgent()->create();

    $this->actingAs($manager, 'admin')->put(route('admin.leads.assign', $lead), ['assigned_to' => $target->id]);
    expect($lead->fresh()->assigned_to)->toBe($target->id);
    Notification::assertSentTo($target, LeadAssignedNotification::class);

    $this->actingAs($manager, 'admin')
        ->put(route('admin.leads.assign', $lead), ['assigned_to' => Admin::factory()->fullAccess()->create()->id])
        ->assertSessionHasErrors('assigned_to');

    $this->actingAs($manager, 'admin')->put(route('admin.leads.assign', $lead), ['assigned_to' => null]);
    expect($lead->fresh()->assigned_to)->toBeNull();
});

it('marks a follow-up done only once its date has come, and cancelling alerts other managers', function () {
    Notification::fake();
    $manager = Admin::factory()->leadManager()->create();
    $other = Admin::factory()->leadManager()->create();
    $future = Lead::factory()->create(['next_follow_up_at' => LeadClock::today()->addDays(2)->toDateString()]);

    $this->actingAs($manager, 'admin')->post(route('admin.leads.dates', $future), ['kind' => 'follow_up', 'outcome' => 'done']);
    expect($future->fresh()->next_follow_up_at)->not->toBeNull();

    $this->actingAs($manager, 'admin')->post(route('admin.leads.dates', $future), ['kind' => 'follow_up', 'outcome' => 'cancelled']);
    expect($future->fresh()->next_follow_up_at)->toBeNull();
    Notification::assertSentTo($other, FollowUpCancelledNotification::class);

    $due = Lead::factory()->create(['meeting_date' => LeadClock::todayString(), 'meeting_time' => '10:00']);
    $this->actingAs($manager, 'admin')->post(route('admin.leads.dates', $due), ['kind' => 'meeting', 'outcome' => 'done']);

    expect($due->fresh()->meeting_date)->toBeNull()
        ->and($due->fresh()->meeting_time)->toBeNull()
        ->and($due->detailUpdateLogs()->first()->action)->toBe('meeting_done');
});

it('adds notes with the author\'s name', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->assignedTo($agent)->create();

    $this->actingAs($agent, 'admin')->post(route('admin.leads.notes', $lead), ['note' => 'Called, will call back Monday.']);

    expect($lead->notes()->first())
        ->note->toBe('Called, will call back Monday.')
        ->admin_name->toBe($agent->name);
});

it('lets only managers delete, keeping a deletion record', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $manager = Admin::factory()->leadManager()->create();
    $lead = Lead::factory()->assignedTo($agent)->create();
    $lead->notes()->create(['note' => 'x', 'admin_id' => $agent->id, 'admin_name' => $agent->name]);

    $this->actingAs($agent, 'admin')->delete(route('admin.leads.destroy', $lead))->assertForbidden();

    $this->flushSession();
    $this->actingAs($manager, 'admin')->delete(route('admin.leads.destroy', $lead))->assertRedirect(route('admin.leads.index'));

    $audit = LeadDeletionAudit::firstOrFail();

    expect(Lead::find($lead->id))->toBeNull()
        ->and($audit->lead_identifier)->toBe($lead->identifier)
        ->and($audit->deleted_by_name)->toBe($manager->name)
        ->and($audit->cascade_summary['notes'])->toBe(1);
});

it('blocks deleting a status that leads are in', function () {
    $mother = Admin::factory()->create();
    $lead = Lead::factory()->create();

    $this->actingAs($mother, 'admin')
        ->delete(route('admin.lead-settings.statuses.destroy', $lead->status_id))
        ->assertSessionHas('error');

    expect(LeadStatus::find($lead->status_id))->not->toBeNull();
});

it('exports the filtered list as CSV for managers only', function () {
    $manager = Admin::factory()->leadManager()->create();
    Lead::factory()->create(['name' => 'Alpha Person']);
    Lead::factory()->create(['name' => 'Beta Person', 'email' => '=cmd@example.com']);

    $csv = $this->actingAs($manager, 'admin')
        ->get(route('admin.leads.export', ['search' => 'beta']))
        ->assertOk()
        ->streamedContent();

    expect($csv)->toContain('Beta Person')->toContain("'=cmd@example.com")->not->toContain('Alpha Person');

    $this->flushSession();
    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')
        ->get(route('admin.leads.export'))
        ->assertForbidden();
});
