<?php

use App\Models\Admin;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->motherAdmin = Admin::factory()->create(['password' => bcrypt('mother-secret')]);
});

function createTestTransaction(array $attributes = []): Transaction
{
    return Transaction::create(array_merge([
        'name' => 'Transaction Customer',
        'email' => 'transaction@example.com',
        'amount' => 100,
        'status' => 'Processing',
        'transaction_id' => 'txn-'.uniqid(),
    ], $attributes));
}

it('filters transactions by status', function () {
    createTestTransaction(['status' => 'Pending', 'name' => 'Pending Customer']);
    createTestTransaction(['status' => 'Processing', 'name' => 'Processing Customer']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.transactions.index', ['status' => 'Pending']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Transaction/Index')
            ->where('transactions.data', fn ($data) => collect($data)->pluck('status')->all() === ['Pending'])
            ->where('filters.status', 'Pending')
        );
});

it('filters transactions by a created_at date range', function () {
    createTestTransaction(['name' => 'Old Transaction'])
        ->forceFill(['created_at' => '2020-01-01 00:00:00'])
        ->save();
    createTestTransaction(['name' => 'New Transaction'])
        ->forceFill(['created_at' => '2026-06-01 00:00:00'])
        ->save();

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.transactions.index', ['date_from' => '2026-01-01', 'date_to' => '2026-12-31']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('transactions.data', fn ($data) => collect($data)->pluck('name')->all() === ['New Transaction'])
        );
});

it('filters transactions by a search term across name, email, and transaction id', function () {
    createTestTransaction(['name' => 'Searchable Customer', 'email' => 'findme@example.com', 'transaction_id' => 'unique-txn-1']);
    createTestTransaction(['name' => 'Other Customer', 'email' => 'other@example.com', 'transaction_id' => 'unique-txn-2']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.transactions.index', ['search' => 'findme']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('transactions.data', fn ($data) => collect($data)->pluck('email')->all() === ['findme@example.com'])
        );
});

it('filters transactions by customer name, email, or phone', function () {
    createTestTransaction(['name' => 'Searchable Person', 'email' => 'findme@example.com', 'phone' => '0123456789']);
    createTestTransaction(['name' => 'Other Person', 'email' => 'other@example.com', 'phone' => '0987654321']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.transactions.index', ['customer' => 'findme']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('transactions.data', fn ($data) => collect($data)->pluck('name')->all() === ['Searchable Person'])
            ->where('filters.customer', 'findme')
        );
});

it('filters transactions by a partial-match text field', function (string $field) {
    createTestTransaction([$field => 'match-12345', 'name' => 'Match Customer']);
    createTestTransaction([$field => 'other-99999', 'name' => 'Other Customer']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.transactions.index', [$field => 'match']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('transactions.data', fn ($data) => collect($data)->pluck('name')->all() === ['Match Customer'])
        );
})->with(['transaction_id', 'invoice_number', 'bank_tran_id', 'card_no']);

it('filters transactions by an exact-match dropdown field', function (string $field, string $matchValue, string $otherValue) {
    createTestTransaction([$field => $matchValue, 'name' => 'Match Customer']);
    createTestTransaction([$field => $otherValue, 'name' => 'Other Customer']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.transactions.index', [$field => $matchValue]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('transactions.data', fn ($data) => collect($data)->pluck('name')->all() === ['Match Customer'])
        );
})->with([
    'card type' => ['card_type', 'VISA', 'MasterCard'],
    'card issuer' => ['card_issuer', 'Bank A', 'Bank B'],
    'card issuer country' => ['card_issuer_country', 'Bangladesh', 'India'],
    'currency type' => ['currency_type', 'BDT', 'USD'],
    'risk title' => ['risk_title', 'Low Risk', 'High Risk'],
]);

it('filters transactions by an amount range', function () {
    createTestTransaction(['name' => 'Cheap Transaction', 'amount' => 50]);
    createTestTransaction(['name' => 'Mid Transaction', 'amount' => 150]);
    createTestTransaction(['name' => 'Expensive Transaction', 'amount' => 500]);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.transactions.index', ['amount_min' => 100, 'amount_max' => 200]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('transactions.data', fn ($data) => collect($data)->pluck('name')->all() === ['Mid Transaction'])
        );
});

it('filters transactions by a store amount range', function () {
    createTestTransaction(['name' => 'Low Store Amt', 'store_amount' => 10]);
    createTestTransaction(['name' => 'Mid Store Amt', 'store_amount' => 60]);
    createTestTransaction(['name' => 'High Store Amt', 'store_amount' => 200]);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.transactions.index', ['store_amount_min' => 50, 'store_amount_max' => 100]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('transactions.data', fn ($data) => collect($data)->pluck('name')->all() === ['Mid Store Amt'])
        );
});

it('exposes filter options for transactions', function () {
    createTestTransaction([
        'card_type' => 'VISA',
        'card_issuer' => 'Bank A',
        'card_issuer_country' => 'Bangladesh',
        'currency_type' => 'BDT',
        'risk_title' => 'Low Risk',
    ]);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.transactions.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filterOptions.cardTypes', fn ($values) => collect($values)->contains('VISA'))
            ->where('filterOptions.cardIssuers', fn ($values) => collect($values)->contains('Bank A'))
            ->where('filterOptions.cardIssuerCountries', fn ($values) => collect($values)->contains('Bangladesh'))
            ->where('filterOptions.currencyTypes', fn ($values) => collect($values)->contains('BDT'))
            ->where('filterOptions.riskTitles', fn ($values) => collect($values)->contains('Low Risk'))
        );
});

it('includes the currency rate for each transaction', function () {
    createTestTransaction(['name' => 'Rated Transaction', 'currency_type' => 'USD', 'currency_rate' => 110.5]);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.transactions.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('transactions.data', fn ($data) => collect($data)->firstWhere('name', 'Rated Transaction')['currency_rate'] === '110.5000')
        );
});

it('rejects erasing transactions without the mother admin password', function () {
    $transaction = createTestTransaction(['status' => 'Failed']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->delete(route('admin.transactions.erase'), ['status' => 'Failed'])
        ->assertSessionHasErrors(['password']);

    $this->assertDatabaseHas('transactions', ['id' => $transaction->id]);
});

it('rejects erasing transactions with an incorrect mother admin password', function () {
    $transaction = createTestTransaction(['status' => 'Failed']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->delete(route('admin.transactions.erase'), ['status' => 'Failed', 'password' => 'wrong-password'])
        ->assertSessionHasErrors(['password']);

    $this->assertDatabaseHas('transactions', ['id' => $transaction->id]);
});

it('erases failed transactions and their linked orders using the mother admin password as a master key', function () {
    $regularAdmin = Admin::factory()->regular()->create(['password' => bcrypt('regular-secret')]);

    $failedTransaction = createTestTransaction(['status' => 'Failed', 'transaction_id' => 'linked-txn']);
    $keptTransaction = createTestTransaction(['status' => 'Processing', 'transaction_id' => 'kept-txn']);

    $linkedOrderId = DB::table('orders')->insertGetId([
        'name' => 'Linked Order',
        'email' => 'linked@example.com',
        'amount' => 50,
        'currency' => 'USD',
        'status' => 'Failed',
        'transaction_id' => 'linked-txn',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $keptOrderId = DB::table('orders')->insertGetId([
        'name' => 'Kept Order',
        'email' => 'kept@example.com',
        'amount' => 75,
        'currency' => 'USD',
        'status' => 'Processing',
        'transaction_id' => 'kept-txn',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($regularAdmin, 'admin')
        ->delete(route('admin.transactions.erase'), ['status' => 'Failed', 'password' => 'mother-secret'])
        ->assertRedirect();

    $this->assertDatabaseMissing('transactions', ['id' => $failedTransaction->id]);
    $this->assertDatabaseHas('transactions', ['id' => $keptTransaction->id]);
    $this->assertDatabaseMissing('orders', ['id' => $linkedOrderId]);
    $this->assertDatabaseHas('orders', ['id' => $keptOrderId]);
});

it('blocks guests from transaction management routes', function () {
    $this->get(route('admin.transactions.index'))->assertRedirect(route('admin.login'));
    $this->delete(route('admin.transactions.erase'), ['status' => 'Failed', 'password' => 'mother-secret'])
        ->assertRedirect(route('admin.login'));
});
