<?php

use App\Models\User;
use Illuminate\Support\Facades\Config;
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
