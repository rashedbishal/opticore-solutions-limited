<?php

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the checkout page with the gateway embed script url from config, not hardcoded', function () {
    $user = User::factory()->create();

    Config::set('sslcommerz.embedScriptUrl', 'https://example-gateway.test/embed.min.js');

    $this->actingAs($user)
        ->get(route('checkout', [
            'service' => 'Web Development',
            'plan' => 'Standard',
            'price' => '$100',
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Checkout')
            ->where('sslEmbedScriptUrl', 'https://example-gateway.test/embed.min.js')
        );
});

it('resolves the live seamless-epay embed domain when SSLCZ_TESTMODE is off', function () {
    expect(config('sslcommerz.embedScriptUrl'))->toBe('https://seamless-epay.sslcommerz.com/embed.min.js');
})->skip(fn () => (bool) env('SSLCZ_TESTMODE'), 'SSLCZ_TESTMODE is on — skipping live-domain check');

it('redirects guests away from the checkout page', function () {
    $this->get(route('checkout'))->assertRedirect(route('login'));
});

it('returns the exchange rate as a real number even though the upstream API encodes it as a string', function () {
    Cache::forget('exchange_rate_usd_bdt');

    // exchangerate-api.com's actual response quotes conversion_rate as a
    // string (e.g. "123.3291"), not a JSON number. The frontend calls
    // .toFixed()/.toLocaleString() on this value, which throws if it's
    // ever passed through as a string.
    Http::fake([
        'v6.exchangerate-api.com/*' => Http::response([
            'result' => 'success',
            'base_code' => 'USD',
            'target_code' => 'BDT',
            'conversion_rate' => '123.3291',
        ]),
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->getJson(route('checkout.exchange-rate'))
        ->assertOk()
        ->json();

    expect($response['rate'])->toBeFloat();
    expect($response['rate'])->toBe(123.3291);
});

it('returns a null exchange rate when the upstream API is unreachable', function () {
    Cache::forget('exchange_rate_usd_bdt');

    Http::fake([
        'v6.exchangerate-api.com/*' => Http::response([], 500),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson(route('checkout.exchange-rate'))
        ->assertOk()
        ->assertJson(['rate' => null]);
});
