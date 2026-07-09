<?php

use App\Models\Admin;
use App\Models\MealSelection;
use App\Support\MealClock;

it('lets the mother admin override a selection with the correct password', function () {
    $motherAdmin = Admin::factory()->create(); // default factory password: 'password'
    $staffAdmin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($motherAdmin, 'admin')
        ->post(route('admin.meal-management.selections.override'), [
            'date' => MealClock::today(),
            'admin_id' => $staffAdmin->id,
            'status' => 'accepted',
            'password' => 'password',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('meal_selections', [
        'date' => MealClock::today(),
        'admin_id' => $staffAdmin->id,
        'status' => 'accepted',
        'overridden_by_admin_id' => $motherAdmin->id,
    ], 'meal');
});

it('creates a selection via override when none existed yet', function () {
    $motherAdmin = Admin::factory()->create();
    $staffAdmin = Admin::factory()->withPermissions(['meal-management'])->create();

    expect(MealSelection::query()->where('admin_id', $staffAdmin->id)->exists())->toBeFalse();

    $this->actingAs($motherAdmin, 'admin')->post(route('admin.meal-management.selections.override'), [
        'date' => MealClock::today(),
        'admin_id' => $staffAdmin->id,
        'status' => 'declined',
        'password' => 'password',
    ]);

    $this->assertDatabaseHas('meal_selections', [
        'admin_id' => $staffAdmin->id,
        'status' => 'declined',
    ], 'meal');
});

it('rejects an override with the wrong password and leaves state untouched', function () {
    $motherAdmin = Admin::factory()->create();
    $staffAdmin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($motherAdmin, 'admin')
        ->post(route('admin.meal-management.selections.override'), [
            'date' => MealClock::today(),
            'admin_id' => $staffAdmin->id,
            'status' => 'accepted',
            'password' => 'wrong-password',
        ])
        ->assertSessionHasErrors('password');

    $this->assertDatabaseMissing('meal_selections', ['admin_id' => $staffAdmin->id], 'meal');
});

it('forbids a non-mother admin from overriding a selection', function () {
    $regularAdmin = Admin::factory()->withPermissions(['meal-management'])->create();
    $staffAdmin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($regularAdmin, 'admin')
        ->post(route('admin.meal-management.selections.override'), [
            'date' => MealClock::today(),
            'admin_id' => $staffAdmin->id,
            'status' => 'accepted',
            'password' => 'password',
        ])
        ->assertForbidden();
});
