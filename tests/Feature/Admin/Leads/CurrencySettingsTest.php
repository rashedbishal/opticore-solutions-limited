<?php

use App\Leads\Models\Currency;
use App\Models\Admin;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->mother = Admin::factory()->create();
});

it('starts with BDT and USD', function () {
    $this->actingAs($this->mother, 'admin')
        ->get(route('admin.lead-settings.currencies.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/LeadSettings/Currencies')
            ->has('currencies', 2)
            ->where('currencies.0.code', 'BDT')
            ->where('currencies.1.code', 'USD')
        );
});

it('adds a currency with an upper-case code', function () {
    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.lead-settings.currencies.store'), ['code' => 'eur', 'name' => 'Euro'])
        ->assertSessionHasNoErrors();

    expect(Currency::where('code', 'EUR')->exists())->toBeTrue();
});

it('refuses a duplicate or non-letter code', function () {
    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.lead-settings.currencies.store'), ['code' => 'usd', 'name' => 'Dollar again'])
        ->assertSessionHasErrors('code');

    $this->actingAs($this->mother, 'admin')
        ->post(route('admin.lead-settings.currencies.store'), ['code' => 'US1', 'name' => 'Bad'])
        ->assertSessionHasErrors('code');
});

it('edits and deletes an unused currency', function () {
    $currency = Currency::factory()->create(['code' => 'GBP', 'name' => 'Pound']);

    $this->actingAs($this->mother, 'admin')
        ->put(route('admin.lead-settings.currencies.update', $currency), ['code' => 'GBP', 'name' => 'Pound Sterling'])
        ->assertSessionHasNoErrors();

    expect($currency->fresh()->name)->toBe('Pound Sterling');

    $this->actingAs($this->mother, 'admin')
        ->delete(route('admin.lead-settings.currencies.destroy', $currency))
        ->assertSessionHas('success');

    expect(Currency::find($currency->id))->toBeNull();
});
