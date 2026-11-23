<?php

use App\Leads\Enums\DealStatus;
use App\Leads\Enums\TaskStatus;
use App\Leads\Models\Deal;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadCustomFieldDefinition;
use App\Leads\Models\LeadCustomFieldValue;
use App\Leads\Models\LeadSetting;
use App\Leads\Models\LeadTag;
use App\Leads\Models\LeadTask;
use App\Leads\Notifications\TaskAlertNotification;
use App\Leads\Notifications\TaskAssignedNotification;
use App\Models\Admin;
use Illuminate\Support\Carbon;

it('lets only managers manage the tag and custom field lists', function () {
    $agent = Admin::factory()->leadAgent()->create();

    $this->actingAs($agent, 'admin')->get(route('admin.leads.catalog.tags'))->assertForbidden();
    $this->actingAs($agent, 'admin')->post(route('admin.leads.catalog.fields.store'), ['name' => 'X', 'type' => 'text', 'sort_order' => 0])->assertForbidden();

    $this->flushSession();
    $manager = Admin::factory()->leadManager()->create();

    $this->actingAs($manager, 'admin')->post(route('admin.leads.catalog.tags.store'), ['name' => 'VIP', 'color' => 'amber'])->assertSessionHasNoErrors();
    $this->actingAs($manager, 'admin')->post(route('admin.leads.catalog.tags.store'), ['name' => 'vip', 'color' => 'red'])->assertSessionHasErrors('name');

    expect(LeadTag::sole()->name)->toBe('VIP');
});

it('lets anyone working the lead add and remove tags, but not others', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->assignedTo($agent)->create();
    $tag = LeadTag::create(['name' => 'Hot', 'slug' => 'hot', 'color' => 'red']);

    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')->post(route('admin.leads.tags.attach', $lead), ['tag_id' => $tag->id])->assertForbidden();

    $this->flushSession();
    $this->actingAs($agent, 'admin')->post(route('admin.leads.tags.attach', $lead), ['tag_id' => $tag->id])->assertSessionHas('success');
    expect($lead->tags()->pluck('name')->all())->toBe(['Hot']);

    $this->actingAs($agent, 'admin')->delete(route('admin.leads.tags.detach', [$lead, $tag]));
    expect($lead->tags()->count())->toBe(0);
});

it('tracks deals through Open, Won and Lost, never straight from Won to Lost', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->assignedTo($agent)->create();

    $this->actingAs($agent, 'admin')
        ->post(route('admin.leads.deals.store', $lead), ['name' => 'Website', 'value' => '1500.50', 'probability' => 60])
        ->assertSessionHasNoErrors();

    $deal = Deal::sole();
    expect($deal->status)->toBe(DealStatus::Open)->and($deal->value)->toBe('1500.50');

    $this->actingAs($agent, 'admin')->post(route('admin.leads.deals.status', [$lead, $deal]), ['status' => 'won']);
    $this->actingAs($agent, 'admin')->post(route('admin.leads.deals.status', [$lead, $deal]), ['status' => 'lost'])->assertSessionHas('error', 'That status change is not allowed.');

    expect($deal->fresh()->status)->toBe(DealStatus::Won)
        ->and($deal->fresh()->actual_close_date)->not->toBeNull()
        ->and($deal->statusLogs()->sole()->changed_by_name)->toBe($agent->name);

    $this->actingAs($agent, 'admin')->delete(route('admin.leads.deals.destroy', [$lead, $deal]))->assertForbidden();
});

it('creates tasks, alerts the assignee, and lets an agent delete only their own', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $colleague = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->assignedTo($agent)->create();

    $this->actingAs($agent, 'admin')
        ->post(route('admin.leads.tasks.store', $lead), ['title' => 'Send quote', 'priority' => 'high', 'due_date' => '2026-12-01', 'assigned_to' => $colleague->id])
        ->assertSessionHasNoErrors();

    $task = LeadTask::sole();
    expect($task->status)->toBe(TaskStatus::Pending)
        ->and($colleague->notifications()->where('type', TaskAssignedNotification::class)->count())->toBe(1);

    $this->actingAs($agent, 'admin')->post(route('admin.leads.tasks.status', [$lead, $task]), ['status' => 'completed']);
    expect($task->fresh()->status)->toBe(TaskStatus::Completed)->and($task->fresh()->closed_at)->not->toBeNull();

    $this->actingAs($agent, 'admin')->delete(route('admin.leads.tasks.destroy', [$lead, $task]))->assertForbidden();

    $task->update(['assigned_to' => $agent->id]);
    $this->actingAs($agent, 'admin')->delete(route('admin.leads.tasks.destroy', [$lead, $task]))->assertSessionHas('success');
    expect(LeadTask::count())->toBe(0);
});

it('rejects a task or deal person without lead access', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->assignedTo($agent)->create();
    $outsider = Admin::factory()->regular()->create();

    $this->actingAs($agent, 'admin')
        ->post(route('admin.leads.tasks.store', $lead), ['title' => 'X', 'priority' => 'low', 'assigned_to' => $outsider->id])
        ->assertSessionHasErrors('assigned_to');
});

it('saves custom field values, never storing blanks, and locks the type once used', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->assignedTo($agent)->create();
    $pages = LeadCustomFieldDefinition::create(['name' => 'Pages', 'key' => 'pages', 'type' => 'number']);
    $size = LeadCustomFieldDefinition::create(['name' => 'Size', 'key' => 'size', 'type' => 'select', 'options' => ['Small', 'Large']]);

    $this->actingAs($agent, 'admin')
        ->put(route('admin.leads.custom-fields.save', $lead), ['fields' => [$pages->id => 'many', $size->id => 'Small']])
        ->assertSessionHasErrors("fields.{$pages->id}");

    $this->actingAs($agent, 'admin')->put(route('admin.leads.custom-fields.save', $lead), ['fields' => [$pages->id => '12', $size->id => 'Small']]);
    expect(LeadCustomFieldValue::count())->toBe(2);

    $this->actingAs($agent, 'admin')->put(route('admin.leads.custom-fields.save', $lead), ['fields' => [$pages->id => '', $size->id => 'Small']]);
    expect(LeadCustomFieldValue::sole()->value)->toBe('Small');

    $this->flushSession();
    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->put(route('admin.leads.catalog.fields.update', $size), ['name' => 'Size', 'type' => 'select', 'options_text' => "Small\nMedium", 'sort_order' => 0])
        ->assertSessionHasErrors('type');
});

it('sends task reminders at 8 AM only when switched on, once a day', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->assignedTo($agent)->create();
    Carbon::setTestNow('2026-12-01 03:00:00');
    LeadTask::create(['lead_id' => $lead->id, 'title' => 'Call back', 'priority' => 'medium', 'status' => 'pending', 'due_date' => '2026-12-02', 'assigned_to' => $agent->id]);

    $this->artisan('tasks:send-alert-notifications')->assertSuccessful();
    expect($agent->notifications()->count())->toBe(0);

    LeadSetting::current()->update(['task_alert_enabled' => true, 'task_alert_days_before' => 1]);
    $this->artisan('tasks:send-alert-notifications');
    $this->artisan('tasks:send-alert-notifications');

    expect($agent->notifications()->where('type', TaskAlertNotification::class)->count())->toBe(1);
});
