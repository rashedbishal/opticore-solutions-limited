<?php

use App\Models\Admin;
use App\Models\MealSelection;
use App\Support\MealClock;
use Illuminate\Support\Carbon;

beforeEach(fn () => Carbon::setTestNow(Carbon::parse('2026-07-08 09:00:00', MealClock::TIMEZONE)));
afterEach(fn () => Carbon::setTestNow());

it('rejects exporting a month with no lunch data', function () {
    $motherAdmin = Admin::factory()->create();

    $this->actingAs($motherAdmin, 'admin')
        ->get(route('admin.meal-management.report.export', ['month' => now()->format('Y-m')]))
        ->assertStatus(422)
        ->assertJsonPath('message', fn ($message) => str_contains($message, 'No lunch data'));
});

it('exports an xlsx file for a month with lunch data', function () {
    $motherAdmin = Admin::factory()->create();
    $staffAdmin = Admin::factory()->withPermissions(['meal-management'])->create();

    MealSelection::query()->create([
        'date' => MealClock::today(),
        'admin_id' => $staffAdmin->id,
        'status' => 'accepted',
        'decided_at' => MealClock::now(),
    ]);

    $response = $this->actingAs($motherAdmin, 'admin')
        ->get(route('admin.meal-management.report.export', ['month' => now()->format('Y-m')]));

    $response->assertOk();
    expect($response->headers->get('Content-Type'))
        ->toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

it('rejects a month outside the current-plus-two-previous window', function () {
    $motherAdmin = Admin::factory()->create();

    $this->actingAs($motherAdmin, 'admin')
        ->get(route('admin.meal-management.report.export', ['month' => now()->subMonths(6)->format('Y-m')]))
        ->assertStatus(422);
});

it('forbids a non-mother admin from exporting the report', function () {
    $regularAdmin = Admin::factory()->withPermissions(['meal-management'])->create();

    $this->actingAs($regularAdmin, 'admin')
        ->get(route('admin.meal-management.report.export', ['month' => now()->format('Y-m')]))
        ->assertForbidden();
});
