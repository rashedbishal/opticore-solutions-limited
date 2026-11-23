<?php

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

it('saves which sources an agent may see unowned leads from, and clears them for other roles', function () {
    $mother = Admin::factory()->create();
    $source = LeadSource::ofType(LeadSourceType::ContactForm);

    $this->actingAs($mother, 'admin')->post(route('admin.users.store'), [
        'name' => 'Agent A',
        'email' => 'a@example.com',
        'password' => 'password123',
        'lead_role' => 'agent',
        'unassigned_lead_source_ids' => [$source->id],
    ]);

    $agent = Admin::where('email', 'a@example.com')->firstOrFail();
    expect(DB::table('lead_source_unassigned_viewers')->where('admin_id', $agent->id)->pluck('lead_source_id')->all())->toBe([$source->id]);

    $this->actingAs($mother, 'admin')->put(route('admin.users.update', $agent), [
        'name' => $agent->name,
        'email' => $agent->email,
        'lead_role' => 'manager',
        'unassigned_lead_source_ids' => [$source->id],
    ]);

    expect(DB::table('lead_source_unassigned_viewers')->where('admin_id', $agent->id)->exists())->toBeFalse();
});

it('asks who receives a deleted admin\'s leads, then moves them', function () {
    $mother = Admin::factory()->create();
    $leaving = Admin::factory()->leadAgent()->create();
    $receiver = Admin::factory()->leadAgent()->create();
    $leads = Lead::factory()->count(2)->assignedTo($leaving)->create();

    $this->actingAs($mother, 'admin')
        ->get(route('admin.users.index'))
        ->assertInertia(fn (Assert $page) => $page->where('users.data', fn ($users) => collect($users)->firstWhere('id', $leaving->id)['owned_leads_count'] === 2));

    $this->actingAs($mother, 'admin')->delete(route('admin.users.destroy', $leaving))->assertSessionHas('error');
    expect(Admin::find($leaving->id))->not->toBeNull();

    $this->actingAs($mother, 'admin')
        ->delete(route('admin.users.destroy', $leaving), ['transfer_to' => $receiver->id])
        ->assertSessionHas('success');

    expect(Admin::find($leaving->id))->toBeNull()
        ->and($leads->map(fn (Lead $lead) => $lead->fresh()->assigned_to)->unique()->all())->toBe([$receiver->id]);
});

it('deletes an admin without leads as before', function () {
    $mother = Admin::factory()->create();
    $admin = Admin::factory()->leadAgent()->create();

    $this->actingAs($mother, 'admin')->delete(route('admin.users.destroy', $admin))->assertSessionHas('success');

    expect(Admin::find($admin->id))->toBeNull();
});
