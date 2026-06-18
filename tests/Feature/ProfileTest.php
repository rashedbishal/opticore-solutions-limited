<?php

use App\Models\PortfolioSubCategory;
use App\Models\Subscription;
use App\Models\Task;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Inertia\Testing\AssertableInertia as Assert;

function createProfileTransaction(array $attributes = []): Transaction
{
    return Transaction::create(array_merge([
        'name' => 'Profile Customer',
        'email' => 'profile@example.com',
        'amount' => 100,
        'currency' => 'USD',
        'status' => 'Processing',
        'transaction_id' => 'txn-'.uniqid(),
    ], $attributes));
}

function invoiceVerifyToken(Transaction $transaction): string
{
    return strtr(Crypt::encryptString((string) $transaction->id), '+/', '-_');
}

it('automatically generates an order number in ORD-YYYYMM-XXXXX format', function () {
    $transaction = createProfileTransaction();

    expect($transaction->order_number)->toBe('ORD-'.now()->format('Ym').'-00001');
});

it('does not override an explicitly provided order number', function () {
    $transaction = createProfileTransaction(['order_number' => 'ORD-CUSTOM']);

    expect($transaction->order_number)->toBe('ORD-CUSTOM');
});

it('generates unique order numbers for multiple transactions', function () {
    $first = createProfileTransaction();
    $second = createProfileTransaction();

    expect($first->order_number)->not->toBe($second->order_number);
});

it('renders the profile page with the user\'s workflow tasks and processing orders', function () {
    $user = User::factory()->create(['email' => 'profile@example.com']);
    $otherUser = User::factory()->create(['email' => 'other@example.com']);

    $subCategory = PortfolioSubCategory::factory()->create(['name' => 'Logo Design']);

    $processingOrder = createProfileTransaction([
        'email' => $user->email,
        'subcategory_id' => $subCategory->id,
        'invoice_number' => 'INV-1',
    ]);

    $task = Task::factory()->create([
        'user_id' => $user->id,
        'sub_category_id' => $subCategory->id,
        'task_name' => 'My Task',
        'state' => 'in progress',
        'transaction_id' => $processingOrder->transaction_id,
    ]);

    Task::factory()->create(['user_id' => $otherUser->id]);

    createProfileTransaction([
        'email' => $user->email,
        'status' => 'Pending',
    ]);

    createProfileTransaction([
        'email' => $otherUser->email,
        'status' => 'Processing',
    ]);

    $this->actingAs($user)
        ->get(route('profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Profile')
            ->has('tasks', 1)
            ->where('tasks.0.id', $task->id)
            ->where('tasks.0.task_name', 'My Task')
            ->where('tasks.0.sub_category', 'Logo Design')
            ->where('tasks.0.order_number', $processingOrder->order_number)
            ->has('orders', 1)
            ->where('orders.0.id', $processingOrder->id)
            ->where('orders.0.order_number', $processingOrder->order_number)
        );
});

it('forbids downloading another user\'s invoice', function () {
    $user = User::factory()->create(['email' => 'owner@example.com']);
    $otherUser = User::factory()->create(['email' => 'other@example.com']);

    $transaction = createProfileTransaction([
        'email' => $otherUser->email,
        'invoice_number' => 'INV-100',
    ]);

    $this->actingAs($user)
        ->get(route('orders.invoice', $transaction))
        ->assertForbidden();
});

it('returns not found when the order is not processing or has no invoice number', function () {
    $user = User::factory()->create(['email' => 'owner@example.com']);

    $pending = createProfileTransaction([
        'email' => $user->email,
        'status' => 'Pending',
        'invoice_number' => 'INV-101',
    ]);

    $this->actingAs($user)
        ->get(route('orders.invoice', $pending))
        ->assertNotFound();

    $noInvoice = createProfileTransaction([
        'email' => $user->email,
        'invoice_number' => null,
    ]);

    $this->actingAs($user)
        ->get(route('orders.invoice', $noInvoice))
        ->assertNotFound();
});

it('downloads the invoice pdf for an owned processing order', function () {
    $user = User::factory()->create(['email' => 'owner@example.com']);

    $transaction = createProfileTransaction([
        'email' => $user->email,
        'invoice_number' => 'INV-102',
    ]);

    $this->actingAs($user)
        ->get(route('orders.invoice', $transaction))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

it('redirects guests to login and back to the invoice verification page after authenticating', function () {
    $user = User::factory()->create(['email' => 'owner@example.com']);

    $transaction = createProfileTransaction([
        'email' => $user->email,
        'invoice_number' => 'INV-200',
    ]);

    $verifyUrl = route('orders.invoice.verify', ['token' => invoiceVerifyToken($transaction)]);

    $this->get($verifyUrl)->assertRedirect('/login');

    expect(session('url.intended'))->toBe($verifyUrl);

    $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect($verifyUrl);
});

it('shows the invoice pdf inline for an owned processing order via the verification token', function () {
    $user = User::factory()->create(['email' => 'owner@example.com']);

    $transaction = createProfileTransaction([
        'email' => $user->email,
        'invoice_number' => 'INV-201',
    ]);

    $this->actingAs($user)
        ->get(route('orders.invoice.verify', ['token' => invoiceVerifyToken($transaction)]))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

it('forbids verifying another user\'s invoice', function () {
    $user = User::factory()->create(['email' => 'owner@example.com']);
    $otherUser = User::factory()->create(['email' => 'other@example.com']);

    $transaction = createProfileTransaction([
        'email' => $otherUser->email,
        'invoice_number' => 'INV-202',
    ]);

    $this->actingAs($user)
        ->get(route('orders.invoice.verify', ['token' => invoiceVerifyToken($transaction)]))
        ->assertForbidden();
});

it('returns not found for a tampered invoice verification token', function () {
    $user = User::factory()->create(['email' => 'owner@example.com']);

    $this->actingAs($user)
        ->get(route('orders.invoice.verify', ['token' => 'tampered-token']))
        ->assertNotFound();
});

it('defaults new accounts to promotional emails turned off', function () {
    $user = User::factory()->create();

    expect($user->refresh()->notify_promotional_emails)->toBeFalse();
});

it('adds the account email to the newsletter list when promotional emails is turned on', function () {
    $user = User::factory()->create(['email' => 'promo-on@example.com']);

    $this->actingAs($user)
        ->patch(route('profile.preferences'), ['notify_promotional_emails' => true])
        ->assertRedirect();

    expect($user->refresh()->notify_promotional_emails)->toBeTrue();
    expect(Subscription::where('email', 'promo-on@example.com')->exists())->toBeTrue();
});

it('removes the account email from the newsletter list when promotional emails is turned off', function () {
    $user = User::factory()->create([
        'email' => 'promo-off@example.com',
        'notify_promotional_emails' => true,
    ]);
    Subscription::create(['email' => 'promo-off@example.com']);

    $this->actingAs($user)
        ->patch(route('profile.preferences'), ['notify_promotional_emails' => false])
        ->assertRedirect();

    expect($user->refresh()->notify_promotional_emails)->toBeFalse();
    expect(Subscription::where('email', 'promo-off@example.com')->exists())->toBeFalse();
});
