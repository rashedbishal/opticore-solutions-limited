<?php

use App\Leads\Actions\ChangeLeadStatus;
use App\Leads\Enums\LeadPriority;
use App\Leads\Models\Currency;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSetting;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadSourceCost;
use App\Leads\Models\LeadTask;
use App\Leads\Notifications\LeadInactivityAlertNotification;
use App\Models\Admin;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

it('scores leads from the rules, clamped to 0-100, and NULL with no rules', function () {
    $lead = Lead::factory()->create(['priority' => 'low', 'email' => null]);
    expect($lead->fresh()->lead_score)->toBeNull();

    $manager = Admin::factory()->leadManager()->create();
    $this->actingAs($manager, 'admin')->post(route('admin.leads.scoring.store'), ['name' => 'High priority', 'field' => 'priority', 'operator' => '=', 'value' => 'high', 'points' => 70, 'sort_order' => 0])->assertSessionHasNoErrors();
    $this->actingAs($manager, 'admin')->post(route('admin.leads.scoring.store'), ['name' => 'Has email', 'field' => 'has_email', 'operator' => '=', 'value' => '1', 'points' => 50, 'sort_order' => 1]);

    expect($lead->fresh()->lead_score)->toBe(0);

    app(ChangeLeadStatus::class)->handle($lead, null, LeadPriority::High, $manager);
    expect($lead->fresh()->lead_score)->toBe(70);

    $lead->update(['email' => 'a@example.com']);
    $fresh = $lead->fresh();
    expect($fresh->lead_score)->toBe(100)
        ->and($fresh->lead_score_breakdown['raw_total'])->toBe(120)
        ->and(collect($fresh->lead_score_breakdown['matched'])->pluck('rule')->all())->toBe(['High priority', 'Has email']);
});

it('rejects a comparison that does not fit the field, and keeps rules managers-only', function () {
    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->post(route('admin.leads.scoring.store'), ['name' => 'X', 'field' => 'has_phone', 'operator' => '>', 'value' => '1', 'points' => 5, 'sort_order' => 0])
        ->assertSessionHasErrors('operator');

    $this->flushSession();
    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')->get(route('admin.leads.scoring.index'))->assertForbidden();
});

it('reports leads per day, status, source, person and cost per lead', function () {
    Carbon::setTestNow('2026-06-15 06:00:00');
    $manager = Admin::factory()->leadManager()->create();
    $agent = Admin::factory()->leadAgent()->create();
    $source = LeadSource::query()->where('singleton_type', 'contact_form')->sole();
    Lead::factory()->fromSource($source)->assignedTo($agent)->count(2)->create(['created_at' => '2026-05-10 04:00:00']);
    Lead::factory()->create(['created_at' => '2026-06-01 04:00:00', 'first_contacted_at' => '2026-06-01 06:00:00']);
    LeadSourceCost::create(['lead_source_id' => $source->id, 'month' => '2026-05-01', 'amount' => '1000.00', 'currency_id' => Currency::query()->where('code', 'BDT')->value('id') ?? Currency::query()->value('id')]);

    $this->actingAs($manager, 'admin')->get(route('admin.leads.reports.index', ['from' => '2026-05-01', 'to' => '2026-06-15']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('report.total', 3)
            ->where('report.first_response.average_hours', 2)
            ->where('report.people.0.name', $agent->name)
            ->where('report.people.0.count', 2)
            ->where('report.costs.rows.0.leads', 2)
            ->where('report.costs.rows.0.cost_per_lead', 500)
            ->where('report.costs.excluded_months', ['June 2026'])
            ->has('report.daily', 46));
});

it('keeps one currency per source for spend', function () {
    $manager = Admin::factory()->leadManager()->create();
    $source = LeadSource::query()->where('singleton_type', 'manual')->sole();
    [$a, $b] = [Currency::query()->orderBy('code')->value('id'), Currency::create(['code' => 'EUR', 'name' => 'Euro'])->id];

    $this->actingAs($manager, 'admin')->post(route('admin.leads.reports.spend.store'), ['lead_source_id' => $source->id, 'month' => '2026-05', 'amount' => '100', 'currency_id' => $a])->assertSessionHasNoErrors();
    $this->actingAs($manager, 'admin')->post(route('admin.leads.reports.spend.store'), ['lead_source_id' => $source->id, 'month' => '2026-06', 'amount' => '100', 'currency_id' => $b])->assertSessionHasErrors('currency_id');
});

it('nurtures inactive open leads only when switched on', function () {
    $agent = Admin::factory()->leadAgent()->create();
    Carbon::setTestNow('2026-06-01 02:00:00');
    $lead = Lead::factory()->assignedTo($agent)->create();
    Carbon::setTestNow('2026-06-10 02:00:00');

    $this->artisan('leads:nurture-inactive-leads')->assertSuccessful();
    expect($agent->notifications()->count())->toBe(0);

    LeadSetting::current()->update(['nurturing_notify_enabled' => true, 'nurturing_task_enabled' => true, 'nurturing_inactive_days' => 7]);
    $this->artisan('leads:nurture-inactive-leads');
    $this->artisan('leads:nurture-inactive-leads');

    expect($agent->notifications()->where('type', LeadInactivityAlertNotification::class)->count())->toBe(1)
        ->and(LeadTask::query()->where('lead_id', $lead->id)->count())->toBe(1)
        ->and(LeadTask::sole()->title)->toBe('Follow up — inactive for 9 days')
        ->and(LeadTask::sole()->assigned_to)->toBe($agent->id);
});
