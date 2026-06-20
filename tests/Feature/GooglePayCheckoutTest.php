<?php

use App\Models\PortfolioSubCategory;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

function fakeGooglePayConfigResponse(): array
{
    return [
        'APIConnect' => 'SUCCESS',
        'status_code' => 200,
        'data' => [
            'apiVersion' => '2',
            'apiVersionMinor' => '0',
            'gatewayMerchantId' => 'googletest2',
            'gateway' => 'sslcommerz',
            'merchantId' => '01234567890123456789',
            'merchantName' => 'Example Merchant',
            'allowedAuthMethods' => 'PAN_ONLY,CRYPTOGRAM_3DS',
            'allowedCardNetworks' => 'MASTERCARD,VISA',
        ],
    ];
}

function fakeInitiateTransactionResponse(string $actionUrl): array
{
    return [
        'APIConnect' => 'SUCCESS',
        'status_code' => 200,
        'data' => [
            'sessionkey' => 'CA5B772D7E3553CB5B08A78068FF9E68',
            'redirectGatewayURL' => 'https://dev-epay-gw.sslcommerz.com/example',
            'googlepay' => [
                'totalPrice' => '100.00',
                'currencyCode' => 'BDT',
                'countryCode' => 'BD',
                'session_key' => 'yw7yeoy39y293c236446612232343434',
                'actionurl' => $actionUrl,
            ],
        ],
    ];
}

function createGooglePaySubCategory(): PortfolioSubCategory
{
    return PortfolioSubCategory::factory()->create([
        'plans' => [
            'standard' => ['price' => '$100', 'delivery' => '3 Days', 'features' => []],
        ],
    ]);
}

beforeEach(function () {
    // Pin this regardless of the ambient SSLCZ_TESTMODE value (.env vs
    // .env.example disagree on it) so these tests don't depend on which
    // environment file happens to be loaded.
    config(['sslcommerz_googlepay.base_url' => 'https://sandbox.sslcommerz.com']);

    Http::fake([
        'https://v6.exchangerate-api.com/*' => Http::response(['conversion_rate' => 110]),
    ]);
});

it('caches the google pay config and never exceeds the daily call budget', function () {
    Http::fake([
        'https://sandbox.sslcommerz.com/api/v1/merchant-hosted-payment' => Http::response(fakeGooglePayConfigResponse()),
        'https://v6.exchangerate-api.com/*' => Http::response(['conversion_rate' => 110]),
    ]);

    $user = User::factory()->create();

    foreach (range(1, 5) as $_) {
        $this->actingAs($user)->getJson(route('gpay.config'))->assertOk();
    }

    Http::assertSentCount(3);
});

it('serves cached config without calling sslcommerz once the daily budget is spent', function () {
    Cache::put('sslcommerz_googlepay_config', ['gateway' => 'sslcommerz'], now()->addDays(7));
    Cache::put('sslcommerz_googlepay_config_calls_'.now()->format('Y-m-d'), 3, now()->endOfDay());

    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson(route('gpay.config'))
        ->assertOk()
        ->assertJson(['available' => true, 'config' => ['gateway' => 'sslcommerz']]);

    Http::assertNothingSent();
});

it('reports unavailable when there is no cached config and sslcommerz fails', function () {
    Http::fake([
        'https://sandbox.sslcommerz.com/api/v1/merchant-hosted-payment' => Http::response(['APIConnect' => 'INVALID_REQUEST']),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson(route('gpay.config'))
        ->assertOk()
        ->assertJson(['available' => false]);
});

it('blocks guests from the google pay endpoints', function () {
    $this->getJson(route('gpay.config'))->assertUnauthorized();
    $this->postJson(route('gpay.charge'), [])->assertUnauthorized();
});

it('charges via google pay and returns a regular redirect when no 3ds is required', function () {
    $subCategory = createGooglePaySubCategory();

    Http::fake([
        'https://sandbox.sslcommerz.com/api/v1/merchant-hosted-payment' => Http::response(
            fakeInitiateTransactionResponse('https://epay.sslcommerz.com/gpay-action-token')
        ),
        'https://epay.sslcommerz.com/gpay-action-token' => Http::response([
            'status' => 'SUCCESS',
            'message' => 'Payment Redirection.',
            'data' => [
                'type' => 'regular',
                'return_url' => 'https://merchant.example.com/success',
            ],
        ]),
        'https://v6.exchangerate-api.com/*' => Http::response(['conversion_rate' => 110]),
    ]);

    $user = User::factory()->create([
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'address' => '123 Street',
        'country' => 'Bangladesh',
        'phone_number' => '+8801700000000',
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('gpay.charge'), [
            'googlepay_token' => 'fake-google-pay-token',
            'subcategory_id' => $subCategory->id,
            'plan' => 'standard',
            'category_id' => $subCategory->category_slug,
            'service' => 'Web Development',
            'delivery' => '3 Days',
            'subcategory' => $subCategory->name,
        ])
        ->assertOk()
        ->assertJson([
            'status' => 'success',
            'type' => 'regular',
            'return_url' => 'https://merchant.example.com/success',
        ]);

    $transaction = Transaction::where('email', $user->email)->first();

    expect($transaction)->not->toBeNull();
    expect($transaction->status)->toBe('Pending');
    expect($transaction->currency)->toBe('BDT');
    expect($transaction->amount)->toBe('11000.00');

    Http::assertSent(fn ($request) => str_contains($request->url(), 'merchant-hosted-payment')
        && $request['action'] === 'initiateTransaction'
        && $request['enable_cus_googlepay'] === 1
        && $request['success_url'] === url('/success')
        && $request['fail_url'] === url('/fail')
        && $request['cancel_url'] === url('/cancel')
        && $request['ipn_url'] === url('/ipn')
        && is_string($request['value_c'])
        && strlen($request['value_c']) === 64);
});

it('charges via google pay and returns an otp form when 3ds is required', function () {
    $subCategory = createGooglePaySubCategory();

    Http::fake([
        'https://sandbox.sslcommerz.com/api/v1/merchant-hosted-payment' => Http::response(
            fakeInitiateTransactionResponse('https://epay.sslcommerz.com/gpay-action-token')
        ),
        'https://epay.sslcommerz.com/gpay-action-token' => Http::response([
            'status' => 'SUCCESS',
            'message' => 'Payment Redirection.',
            'data' => [
                'type' => 'otp',
                'data' => "<form action='https://bank.example.com/threeDs'></form>",
                'return_url' => 'https://merchant.example.com/success',
            ],
        ]),
    ]);

    $user = User::factory()->create(['email' => 'otp-user@example.com']);

    $this->actingAs($user)
        ->postJson(route('gpay.charge'), [
            'googlepay_token' => 'fake-google-pay-token',
            'subcategory_id' => $subCategory->id,
            'plan' => 'standard',
        ])
        ->assertOk()
        ->assertJson([
            'status' => 'success',
            'type' => 'otp',
        ])
        ->assertJsonFragment(['html' => "<form action='https://bank.example.com/threeDs'></form>"]);
});

it('marks the transaction failed when sslcommerz rejects the google pay token outright', function () {
    $subCategory = createGooglePaySubCategory();

    Http::fake([
        'https://sandbox.sslcommerz.com/api/v1/merchant-hosted-payment' => Http::response(
            fakeInitiateTransactionResponse('https://epay.sslcommerz.com/gpay-action-token')
        ),
        'https://epay.sslcommerz.com/gpay-action-token' => Http::response([
            'status' => 'FAILED',
            'message' => 'Token verification failed.',
        ]),
    ]);

    $user = User::factory()->create(['email' => 'rejected-user@example.com']);

    $this->actingAs($user)
        ->postJson(route('gpay.charge'), [
            'googlepay_token' => 'fake-google-pay-token',
            'subcategory_id' => $subCategory->id,
            'plan' => 'standard',
        ])
        ->assertOk()
        ->assertJson([
            'status' => 'failed',
            'message' => 'Token verification failed.',
        ]);

    $transaction = Transaction::where('email', $user->email)->first();

    expect($transaction->status)->toBe('Failed');
});

it('marks the transaction failed when initiateTransaction itself fails', function () {
    $subCategory = createGooglePaySubCategory();

    Http::fake([
        'https://sandbox.sslcommerz.com/api/v1/merchant-hosted-payment' => Http::response([
            'APIConnect' => 'FAILED',
            'failed_reason' => 'Invalid store credentials.',
        ]),
    ]);

    $user = User::factory()->create(['email' => 'initiate-fails-user@example.com']);

    $this->actingAs($user)
        ->postJson(route('gpay.charge'), [
            'googlepay_token' => 'fake-google-pay-token',
            'subcategory_id' => $subCategory->id,
            'plan' => 'standard',
        ])
        ->assertOk()
        ->assertJson(['status' => 'failed']);

    $transaction = Transaction::where('email', $user->email)->first();

    expect($transaction->status)->toBe('Failed');
});
