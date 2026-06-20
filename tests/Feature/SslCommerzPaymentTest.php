<?php

use App\Models\Transaction;
use App\Models\User;
use App\Support\PaymentReturnToken;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

function createPaymentOrder(string $tranId, string $email, string $status, string $amount = '100'): Transaction
{
    DB::table('orders')->updateOrInsert(
        ['transaction_id' => $tranId],
        [
            'name' => 'Test Customer',
            'email' => $email,
            'phone' => '0123456789',
            'amount' => $amount,
            'status' => $status,
            'address' => 'Test address',
            'currency' => 'USD',
            'created_at' => now(),
            'updated_at' => now(),
        ]
    );

    return Transaction::create([
        'name' => 'Test Customer',
        'email' => $email,
        'phone' => '0123456789',
        'address' => 'Test address',
        'checkout_url' => '/checkout',
        'transaction_id' => $tranId,
        'amount' => $amount,
        'currency' => 'USD',
        'status' => $status,
        'invoice_number' => $status === 'Pending' ? null : 'INV-TEST-'.$tranId,
    ]);
}

function validSslCommerzSignature(array $fields, string $storePassword): array
{
    $hashData = $fields;
    $hashData['store_passwd'] = md5($storePassword);
    ksort($hashData);

    $hashString = '';
    foreach ($hashData as $key => $value) {
        $hashString .= $key.'='.$value.'&';
    }

    return array_merge($fields, [
        'verify_key' => implode(',', array_keys($fields)),
        'verify_sign' => md5(rtrim($hashString, '&')),
    ]);
}

beforeEach(function () {
    config(['sslcommerz.apiCredentials.store_password' => 'test-store-password']);
});

it('logs the customer in on the success callback when the one-time return token matches', function () {
    $user = User::factory()->create(['email' => 'paid-customer@example.com']);
    $transaction = createPaymentOrder('TRX-ALREADY-1', $user->email, 'Processing');
    $token = PaymentReturnToken::generate($transaction->transaction_id);

    $this->post('/success', [
        'tran_id' => $transaction->transaction_id,
        'value_c' => $token,
    ])->assertRedirect(route('profile'));

    $this->assertAuthenticatedAs($user);
});

it('does not log anyone in on a success callback replayed without the original return token', function () {
    $user = User::factory()->create(['email' => 'replay-victim@example.com']);
    $transaction = createPaymentOrder('TRX-ALREADY-2', $user->email, 'Processing');
    PaymentReturnToken::generate($transaction->transaction_id);

    $this->post('/success', [
        'tran_id' => $transaction->transaction_id,
    ])->assertRedirect(route('profile'));

    $this->assertGuest();
});

it('treats the success return token as single-use so a replay cannot log in a second time', function () {
    $user = User::factory()->create(['email' => 'single-use@example.com']);
    $transaction = createPaymentOrder('TRX-ALREADY-3', $user->email, 'Processing');
    $token = PaymentReturnToken::generate($transaction->transaction_id);

    $this->post('/success', [
        'tran_id' => $transaction->transaction_id,
        'value_c' => $token,
    ]);
    $this->assertAuthenticatedAs($user);

    Auth::logout();

    $this->post('/success', [
        'tran_id' => $transaction->transaction_id,
        'value_c' => $token,
    ]);
    $this->assertGuest();
});

it('logs the customer in on a failed payment callback when both the signature and return token are valid', function () {
    $user = User::factory()->create(['email' => 'failed-customer@example.com']);
    $transaction = createPaymentOrder('TRX-FAIL-1', $user->email, 'Pending');
    $token = PaymentReturnToken::generate($transaction->transaction_id);

    $payload = validSslCommerzSignature([
        'tran_id' => $transaction->transaction_id,
        'status' => 'FAILED',
    ], 'test-store-password');
    $payload['value_c'] = $token;

    $this->post('/fail', $payload)->assertRedirect(route('home'));

    $this->assertAuthenticatedAs($user);
});

it('does not log in on a failed payment callback when the return token is missing', function () {
    $user = User::factory()->create(['email' => 'no-token-fail@example.com']);
    $transaction = createPaymentOrder('TRX-FAIL-2', $user->email, 'Pending');
    PaymentReturnToken::generate($transaction->transaction_id);

    $payload = validSslCommerzSignature([
        'tran_id' => $transaction->transaction_id,
        'status' => 'FAILED',
    ], 'test-store-password');

    $this->post('/fail', $payload);

    $this->assertGuest();
});

it('does not log in on a failed payment callback when the signature is invalid', function () {
    $user = User::factory()->create(['email' => 'bad-sig-fail@example.com']);
    $transaction = createPaymentOrder('TRX-FAIL-3', $user->email, 'Pending');
    $token = PaymentReturnToken::generate($transaction->transaction_id);

    $this->post('/fail', [
        'tran_id' => $transaction->transaction_id,
        'status' => 'FAILED',
        'verify_key' => 'tran_id,status',
        'verify_sign' => 'not-a-real-signature',
        'value_c' => $token,
    ]);

    $this->assertGuest();
});

it('logs the customer in on a cancelled payment callback when both the signature and return token are valid', function () {
    $user = User::factory()->create(['email' => 'cancelled-customer@example.com']);
    $transaction = createPaymentOrder('TRX-CANCEL-1', $user->email, 'Pending');
    $token = PaymentReturnToken::generate($transaction->transaction_id);

    $payload = validSslCommerzSignature([
        'tran_id' => $transaction->transaction_id,
        'status' => 'CANCELLED',
    ], 'test-store-password');
    $payload['value_c'] = $token;

    $this->post('/cancel', $payload)->assertRedirect(route('home'));

    $this->assertAuthenticatedAs($user);
});

it('does not log in on a cancelled payment callback when the return token is missing', function () {
    $user = User::factory()->create(['email' => 'no-token-cancel@example.com']);
    $transaction = createPaymentOrder('TRX-CANCEL-2', $user->email, 'Pending');
    PaymentReturnToken::generate($transaction->transaction_id);

    $payload = validSslCommerzSignature([
        'tran_id' => $transaction->transaction_id,
        'status' => 'CANCELLED',
    ], 'test-store-password');

    $this->post('/cancel', $payload);

    $this->assertGuest();
});

it('rate limits the SSLCommerz callback routes to bound flooding, sharing one cap per IP', function () {
    foreach (range(1, 60) as $i) {
        $this->post('/fail', ['tran_id' => "TRX-FLOOD-{$i}"])
            ->assertStatus(302);
    }

    $this->post('/fail', ['tran_id' => 'TRX-FLOOD-61'])->assertStatus(429);

    // The cap is shared across all callback routes from the same IP, not per-route.
    $this->post('/cancel', ['tran_id' => 'TRX-FLOOD-62'])->assertStatus(429);
});
