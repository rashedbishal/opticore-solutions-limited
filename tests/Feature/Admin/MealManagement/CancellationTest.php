<?php

use App\Models\Admin;
use App\Models\MealSelection;
use App\Support\MealClock;
use Illuminate\Support\Carbon;

// Freeze to a Wednesday so "today" is never coincidentally the weekly
// holiday, which would make blockedReason assertions ambiguous.
beforeEach(fn () => Carbon::setTestNow(Carbon::parse('2026-07-08 09:00:00', MealClock::TIMEZONE)));
afterEach(fn () => Carbon::setTestNow());

it('clears existing selections for the day when mother admin cancels it', function () {
    $motherAdmin = Admin::factory()->create();
    $staffAdmin = Admin::factory()->withPermissions(['meal-management'])->create();

    MealSelection::query()->create([
        'date' => MealClock::today(),
        'admin_id' => $staffAdmin->id,
        'status' => 'accepted',
        'decided_at' => MealClock::now(),
    ]);

    $this->actingAs($motherAdmin, 'admin')
        ->post(route('admin.meal-management.cancellations.store'), [
            'date' => MealClock::today(),
            'note' => 'Office closed for maintenance.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('meal_cancellations', [
        'date' => MealClock::today(),
        'note' => 'Office closed for maintenance.',
    ], 'meal');
    $this->assertDatabaseMissing('meal_selections', ['admin_id' => $staffAdmin->id], 'meal');
});

it('surfaces the cancellation note to a regular admin instead of the accept/decline UI', function () {
    $motherAdmin = Admin::factory()->create();
    $staffAdmin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($motherAdmin, 'admin')->post(route('admin.meal-management.cancellations.store'), [
        'date' => MealClock::today(),
        'note' => 'Power outage — lunch is cancelled today.',
    ]);

    $this->actingAs($staffAdmin, 'admin')
        ->get(route('admin.meal-management.index'))
        ->assertInertia(fn ($page) => $page->where('blockedReason', 'Power outage — lunch is cancelled today.'));
});

it('forbids a non-mother admin from cancelling a day', function () {
    $regularAdmin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($regularAdmin, 'admin')
        ->post(route('admin.meal-management.cancellations.store'), [
            'date' => MealClock::today(),
            'note' => 'Nice try.',
        ])
        ->assertForbidden();
});
