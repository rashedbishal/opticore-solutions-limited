<?php

use App\Models\Admin;
use App\Models\MealSelection;
use App\Models\MealSetting;
use App\Support\MealClock;
use Illuminate\Support\Carbon;

/**
 * Exercises MealManagementController::select() and the MealScheduleService
 * window/holiday guards it relies on.
 */
afterEach(function () {
    Carbon::setTestNow();
});

function freezeMealClockTo(string $time): void
{
    Carbon::setTestNow(Carbon::parse('2026-07-08 '.$time, MealClock::TIMEZONE));
}

it('accepts a selection inside the open window', function () {
    freezeMealClockTo('09:00:00');
    MealSetting::query()->create(['accept_start_time' => '08:00:00', 'lock_time' => '11:30:00']);
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($admin, 'admin')
        ->post(route('admin.meal-management.select'), ['status' => 'accepted'])
        ->assertRedirect();

    $this->assertDatabaseHas('meal_selections', [
        'date' => MealClock::today(),
        'admin_id' => $admin->id,
        'status' => 'accepted',
    ], 'meal');
});

it('rejects a selection before the window opens', function () {
    freezeMealClockTo('07:00:00');
    MealSetting::query()->create(['accept_start_time' => '08:00:00', 'lock_time' => '11:30:00']);
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($admin, 'admin')
        ->post(route('admin.meal-management.select'), ['status' => 'accepted']);

    $this->assertDatabaseMissing('meal_selections', ['admin_id' => $admin->id], 'meal');
});

it('rejects a selection after the lock time', function () {
    freezeMealClockTo('12:00:00');
    MealSetting::query()->create(['accept_start_time' => '08:00:00', 'lock_time' => '11:30:00']);
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($admin, 'admin')
        ->post(route('admin.meal-management.select'), ['status' => 'accepted']);

    $this->assertDatabaseMissing('meal_selections', ['admin_id' => $admin->id], 'meal');
});

it('rejects a selection on the weekly holiday', function () {
    // 2026-07-10 is a Friday, the default weekly_holiday_day (5).
    Carbon::setTestNow(Carbon::parse('2026-07-10 09:00:00', MealClock::TIMEZONE));
    MealSetting::query()->create(['accept_start_time' => '08:00:00', 'lock_time' => '11:30:00']);
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($admin, 'admin')
        ->post(route('admin.meal-management.select'), ['status' => 'accepted']);

    $this->assertDatabaseMissing('meal_selections', ['admin_id' => $admin->id], 'meal');
});

it('rejects a selection when the schedule has not been configured yet', function () {
    freezeMealClockTo('09:00:00');
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($admin, 'admin')
        ->post(route('admin.meal-management.select'), ['status' => 'accepted']);

    $this->assertDatabaseMissing('meal_selections', ['admin_id' => $admin->id], 'meal');
});

it('rejects a second selection for the same day', function () {
    freezeMealClockTo('09:00:00');
    MealSetting::query()->create(['accept_start_time' => '08:00:00', 'lock_time' => '11:30:00']);
    $admin = Admin::factory()->withPermissions(['meal-management'])->create();

    MealSelection::query()->create([
        'date' => MealClock::today(),
        'admin_id' => $admin->id,
        'status' => 'accepted',
        'decided_at' => MealClock::now(),
    ]);

    $this->actingAs($admin, 'admin')
        ->post(route('admin.meal-management.select'), ['status' => 'declined']);

    expect(MealSelection::query()->where('admin_id', $admin->id)->count())->toBe(1);
    $this->assertDatabaseHas('meal_selections', ['admin_id' => $admin->id, 'status' => 'accepted'], 'meal');
});
