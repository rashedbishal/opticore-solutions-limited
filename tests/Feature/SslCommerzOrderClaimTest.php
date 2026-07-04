<?php

use App\Http\Controllers\SslCommerzPaymentController;
use Illuminate\Support\Facades\DB;

/**
 * SSLCommerz fires the browser-redirect success() callback and the
 * server-to-server ipn() webhook independently for the same transaction,
 * often within milliseconds of each other. Both call the private
 * claimOrderForProcessing() guard before sending the invoice email/
 * provisioning the workflow task. Calling it twice in a row (as done here)
 * exercises the exact race: both callers can read status "Pending" before
 * either writes "Processing", so only the conditional UPDATE — not a prior
 * read — may decide who proceeds.
 */
function invokeClaimOrderForProcessing(string $tranId): bool
{
    $controller = new SslCommerzPaymentController;
    $method = new ReflectionMethod($controller, 'claimOrderForProcessing');
    $method->setAccessible(true);

    return $method->invoke($controller, $tranId);
}

function insertPendingOrder(string $tranId): void
{
    DB::table('orders')->insert([
        'transaction_id' => $tranId,
        'name' => 'Test Customer',
        'email' => 'race@example.com',
        'phone' => '0123456789',
        'amount' => '100',
        'status' => 'Pending',
        'address' => 'Test address',
        'currency' => 'USD',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

it('lets only the first of two simultaneous claims win, closing the duplicate-processing race', function () {
    insertPendingOrder('TXN-RACE-1');

    $first = invokeClaimOrderForProcessing('TXN-RACE-1');
    $second = invokeClaimOrderForProcessing('TXN-RACE-1');

    expect($first)->toBeTrue();
    expect($second)->toBeFalse();

    expect(DB::table('orders')->where('transaction_id', 'TXN-RACE-1')->value('status'))
        ->toBe('Processing');
});

it('does not claim an order that no longer exists or is not pending', function () {
    expect(invokeClaimOrderForProcessing('does-not-exist'))->toBeFalse();

    DB::table('orders')->insert([
        'transaction_id' => 'TXN-ALREADY-PROCESSING',
        'name' => 'Test Customer',
        'email' => 'race@example.com',
        'phone' => '0123456789',
        'amount' => '100',
        'status' => 'Processing',
        'address' => 'Test address',
        'currency' => 'USD',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    expect(invokeClaimOrderForProcessing('TXN-ALREADY-PROCESSING'))->toBeFalse();
});
