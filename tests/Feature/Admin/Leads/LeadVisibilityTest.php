<?php

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

function grantUnowned(Admin $agent, LeadSource $source): void
{
    DB::table('lead_source_unassigned_viewers')->insert(['lead_source_id' => $source->id, 'admin_id' => $agent->id, 'created_at' => now(), 'updated_at' => now()]);
}

it('shows managers every lead in the table', function () {
    $manager = Admin::factory()->leadManager()->create();
    Lead::factory()->count(3)->create();

    $this->actingAs($manager, 'admin')
        ->get(route('admin.leads.index'))
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Leads/Index')->where('leads.total', 3));
});

it('shows an agent only their own leads plus unowned leads from sources opened to them', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $other = Admin::factory()->leadAgent()->create();
    $contactForm = LeadSource::ofType(LeadSourceType::ContactForm);
    grantUnowned($agent, $contactForm);

    $mine = Lead::factory()->assignedTo($agent)->create();
    $unownedVisible = Lead::factory()->fromSource($contactForm)->create();
    Lead::factory()->create(); // unowned, manual source: not opened to the agent
    Lead::factory()->assignedTo($other)->create();

    $this->actingAs($agent, 'admin')
        ->get(route('admin.leads.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Leads/Board')
            ->has('leads', 2)
            ->where('leads', fn ($leads) => collect($leads)->pluck('id')->sort()->values()->all() === collect([$mine->id, $unownedVisible->id])->sort()->values()->all())
        );
});

it('stops an agent opening someone else\'s lead, in the panel or on its page', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->assignedTo(Admin::factory()->leadAgent()->create())->create();

    $this->actingAs($agent, 'admin')->get(route('admin.leads.show', $lead))->assertForbidden();

    $this->flushSession();

    $this->actingAs($agent, 'admin')
        ->get(route('admin.leads.index', ['lead' => $lead->id]))
        ->assertInertia(fn (Assert $page) => $page->where('selectedLead', null));
});

it('opens a lead in the side panel and marks its update as seen', function () {
    $manager = Admin::factory()->leadManager()->create();
    $lead = Lead::factory()->create();

    $this->actingAs($manager, 'admin')
        ->get(route('admin.leads.index', ['lead' => $lead->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('selectedLead.id', $lead->id)
            ->where('selectedLead.can.assign', true)
            ->where('selectedLead.can.delete', true)
        );

    expect($lead->fresh()->update_seen_at)->not->toBeNull();
});

it('blocks lead actions for an agent on a lead they cannot see', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->create();

    $this->actingAs($agent, 'admin')
        ->put(route('admin.leads.contact', $lead), ['name' => 'Hacker'])
        ->assertForbidden();
});
