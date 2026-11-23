<?php

use App\Leads\Models\Lead;
use App\Leads\Models\LeadDeletionAudit;
use App\Leads\Models\LeadStatus;
use App\Leads\Models\LeadTag;
use App\Models\Admin;

it('changes many leads at once, each through the normal path', function () {
    $manager = Admin::factory()->leadManager()->create();
    $agent = Admin::factory()->leadAgent()->create();
    $leads = Lead::factory()->count(3)->create();
    $status = LeadStatus::query()->orderByDesc('sort_order')->first();
    $tag = LeadTag::create(['name' => 'Hot', 'slug' => 'hot', 'color' => 'red']);
    $ids = $leads->pluck('id')->all();

    $this->actingAs($manager, 'admin')->post(route('admin.leads.bulk'), ['action' => 'status', 'lead_ids' => $ids, 'status_id' => $status->id])->assertSessionHas('success', '3 leads updated.');
    $this->actingAs($manager, 'admin')->post(route('admin.leads.bulk'), ['action' => 'assign', 'lead_ids' => $ids, 'assigned_to' => $agent->id]);
    $this->actingAs($manager, 'admin')->post(route('admin.leads.bulk'), ['action' => 'tag_attach', 'lead_ids' => $ids, 'tag_id' => $tag->id]);

    foreach ($leads as $lead) {
        $lead->refresh();
        expect($lead->status_id)->toBe($status->id)
            ->and($lead->assigned_to)->toBe($agent->id)
            ->and($lead->statusLogs()->count())->toBe(1)
            ->and($lead->tags()->count())->toBe(1);
    }

    $this->actingAs($manager, 'admin')->post(route('admin.leads.bulk'), ['action' => 'delete', 'lead_ids' => $ids])->assertSessionHas('success', '3 leads deleted.');

    expect(Lead::count())->toBe(0)
        ->and(LeadDeletionAudit::where('is_bulk', true)->count())->toBe(3);
});

it('is for managers only, and caps at 100 leads', function () {
    $lead = Lead::factory()->create();

    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')
        ->post(route('admin.leads.bulk'), ['action' => 'unassign', 'lead_ids' => [$lead->id]])
        ->assertForbidden();

    $this->flushSession();
    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->post(route('admin.leads.bulk'), ['action' => 'unassign', 'lead_ids' => array_fill(0, 101, $lead->id)])
        ->assertSessionHasErrors('lead_ids');
});
