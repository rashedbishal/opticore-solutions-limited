<?php

use App\Leads\Models\LeadStatus;
use App\Models\Admin;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->mother = Admin::factory()->create();
});

it('starts with the OptiFin pipeline in order', function () {
    $this->actingAs($this->mother, 'admin')
        ->get(route('admin.lead-settings.statuses.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/LeadSettings/Statuses')
            ->has('statuses', 8)
            ->where('statuses.0.name', 'New')
            ->where('statuses.3.name', 'Proposal Sent')
            ->where('statuses.7.name', 'Unqualified')
            ->where('statuses.5.is_closed', true)
        );
});

it('adds a status at the end of the board', function () {
    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.lead-settings.statuses.store'), ['name' => 'On Hold', 'color' => 'purple', 'is_closed' => false])
        ->assertSessionHasNoErrors();

    $status = LeadStatus::where('slug', 'on-hold')->firstOrFail();

    expect($status->sort_order)->toBe((int) LeadStatus::max('sort_order'))
        ->and($status->color)->toBe('purple');
});

it('refuses a duplicate name or an unknown colour', function () {
    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.lead-settings.statuses.store'), ['name' => 'won', 'color' => 'green', 'is_closed' => true])
        ->assertSessionHasErrors('name');

    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.lead-settings.statuses.store'), ['name' => 'Fresh', 'color' => 'black', 'is_closed' => false])
        ->assertSessionHasErrors('color');
});

it('edits a status, allowing it to keep its own name', function () {
    $status = LeadStatus::where('slug', 'contacted')->firstOrFail();

    $this->actingAs($this->mother, 'admin')
        ->put(route('admin.lead-settings.statuses.update', $status), ['name' => 'Contacted', 'color' => 'teal', 'is_closed' => false])
        ->assertSessionHasNoErrors();

    expect($status->fresh()->color)->toBe('teal');
});

it('saves a new board order', function () {
    $ids = LeadStatus::orderBy('sort_order')->pluck('id')->reverse()->values()->all();

    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.lead-settings.statuses.reorder'), ['ids' => $ids])
        ->assertSessionHasNoErrors();

    expect(LeadStatus::orderBy('sort_order')->pluck('id')->all())->toBe($ids);
});

it('refuses an order that does not list every status exactly once', function () {
    $ids = LeadStatus::orderBy('sort_order')->pluck('id')->all();
    $before = $ids;
    array_pop($ids);

    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.lead-settings.statuses.reorder'), ['ids' => $ids])
        ->assertSessionHasErrors('ids');

    expect(LeadStatus::orderBy('sort_order')->pluck('id')->all())->toBe($before);
});

it('deletes an unused status', function () {
    $status = LeadStatus::factory()->create();

    $this->actingAs($this->mother, 'admin')
        ->delete(route('admin.lead-settings.statuses.destroy', $status))
        ->assertSessionHas('success');

    expect(LeadStatus::find($status->id))->toBeNull();
});

it('blocks a lead manager from changing statuses', function () {
    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->post(route('admin.lead-settings.statuses.store'), ['name' => 'Sneaky', 'color' => 'red', 'is_closed' => false])
        ->assertForbidden();

    expect(LeadStatus::where('slug', 'sneaky')->exists())->toBeFalse();
});
