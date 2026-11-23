<?php

use App\Leads\Enums\AutoDistributionMethod;
use App\Leads\Enums\LeadDistributionMode;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSetting;
use App\Leads\Models\LeadStatus;
use App\Leads\Services\LeadAssignmentService;
use App\Models\Admin;

function autoMode(AutoDistributionMethod $method): void
{
    LeadSetting::current()->update(['distribution_mode' => LeadDistributionMode::Automatic, 'auto_distribution_method' => $method]);
}

it('leaves new leads unowned in manual mode', function () {
    Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->create();

    app(LeadAssignmentService::class)->autoAssign($lead);

    expect($lead->fresh()->assigned_to)->toBeNull();
});

it('takes turns between agents, never giving leads to managers', function () {
    autoMode(AutoDistributionMethod::RoundRobin);
    Admin::factory()->leadManager()->create();
    $first = Admin::factory()->leadAgent()->create();
    $second = Admin::factory()->leadAgent()->create();
    $service = app(LeadAssignmentService::class);

    $owners = collect(range(1, 4))->map(function () use ($service) {
        $lead = Lead::factory()->create();
        $service->autoAssign($lead);

        return $lead->fresh()->assigned_to;
    });

    expect($owners->all())->toBe([$first->id, $second->id, $first->id, $second->id]);
});

it('gives the next lead to the agent with the fewest open leads', function () {
    autoMode(AutoDistributionMethod::LeastLoaded);
    $busy = Admin::factory()->leadAgent()->create();
    $free = Admin::factory()->leadAgent()->create();
    Lead::factory()->count(2)->assignedTo($busy)->create();
    // a closed lead doesn't count as work
    Lead::factory()->assignedTo($free)->create(['status_id' => LeadStatus::where('slug', 'won')->value('id')]);

    $lead = Lead::factory()->create();
    app(LeadAssignmentService::class)->autoAssign($lead);

    expect($lead->fresh()->assigned_to)->toBe($free->id);
});

it('stays unowned when there are no agents', function () {
    autoMode(AutoDistributionMethod::Random);
    $lead = Lead::factory()->create();

    app(LeadAssignmentService::class)->autoAssign($lead);

    expect($lead->fresh()->assigned_to)->toBeNull();
});
