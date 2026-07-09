<?php

use App\Models\Admin;
use App\Models\MealSelection;
use App\Models\MealSetting;
use App\Support\MealClock;
use Illuminate\Support\Carbon;

/**
 * Exercises the AutoDeclineMealSelections console command in isolation
 * from the HTTP layer.
 */
afterEach(function () {
    Carbon::setTestNow();
});

it('auto-declines every eligible admin without a selection once the lock time passes', function () {
    Carbon::setTestNow(Carbon::parse('2026-07-08 12:00:00', MealClock::TIMEZONE));
    MealSetting::query()->create(['accept_start_time' => '08:00:00', 'lock_time' => '11:30:00']);
    $responded = Admin::factory()->withPermissions(['meal-management'])->create();
    $straggler = Admin::factory()->withPermissions(['meal-management'])->create();

    MealSelection::query()->create([
        'date' => MealClock::today(),
        'admin_id' => $responded->id,
        'status' => 'accepted',
        'decided_at' => MealClock::now(),
    ]);

    $this->artisan('meal:auto-decline')->assertSuccessful();

    $this->assertDatabaseHas('meal_selections', [
        'admin_id' => $straggler->id,
        'status' => 'declined',
        'is_auto_declined' => true,
    ], 'meal');
    $this->assertDatabaseHas('meal_selections', [
        'admin_id' => $responded->id,
        'status' => 'accepted',
        'is_auto_declined' => false,
    ], 'meal');
});

it('does nothing before the lock time has passed', function () {
    Carbon::setTestNow(Carbon::parse('2026-07-08 09:00:00', MealClock::TIMEZONE));
    MealSetting::query()->create(['accept_start_time' => '08:00:00', 'lock_time' => '11:30:00']);
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->artisan('meal:auto-decline')->assertSuccessful();

    $this->assertDatabaseMissing('meal_selections', ['admin_id' => $admin->id], 'meal');
});

it('does nothing on the weekly holiday', function () {
    Carbon::setTestNow(Carbon::parse('2026-07-10 23:00:00', MealClock::TIMEZONE));
    MealSetting::query()->create(['accept_start_time' => '08:00:00', 'lock_time' => '11:30:00']);
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->artisan('meal:auto-decline')->assertSuccessful();

    $this->assertDatabaseMissing('meal_selections', ['admin_id' => $admin->id], 'meal');
});

it('is idempotent when run twice after the lock time', function () {
    Carbon::setTestNow(Carbon::parse('2026-07-08 12:00:00', MealClock::TIMEZONE));
    MealSetting::query()->create(['accept_start_time' => '08:00:00', 'lock_time' => '11:30:00']);
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->artisan('meal:auto-decline')->assertSuccessful();
    $this->artisan('meal:auto-decline')->assertSuccessful();

    expect(MealSelection::query()->where('admin_id', $admin->id)->count())->toBe(1);
});
