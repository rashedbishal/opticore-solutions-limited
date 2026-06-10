<?php

use App\Models\Admin;
use App\Models\PortfolioSubCategory;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->motherAdmin = Admin::factory()->create(['password' => bcrypt('mother-secret')]);
});

function createTestOrder(array $attributes = []): int
{
    return DB::table('orders')->insertGetId(array_merge([
        'name' => 'Order Customer',
        'email' => 'order@example.com',
        'amount' => 100,
        'currency' => 'USD',
        'status' => 'Processing',
        'transaction_id' => 'txn-'.uniqid(),
        'created_at' => now(),
        'updated_at' => now(),
    ], $attributes));
}

it('filters orders by status', function () {
    createTestOrder(['status' => 'Pending', 'name' => 'Pending Customer']);
    createTestOrder(['status' => 'Processing', 'name' => 'Processing Customer']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.orders.index', ['status' => 'Pending']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Order/Index')
            ->where('orders.data', fn ($data) => collect($data)->pluck('status')->all() === ['Pending'])
            ->where('filters.status', 'Pending')
        );
});

it('filters orders by a created_at date range', function () {
    createTestOrder(['name' => 'Old Order', 'created_at' => '2020-01-01 00:00:00']);
    createTestOrder(['name' => 'New Order', 'created_at' => '2026-06-01 00:00:00']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.orders.index', ['date_from' => '2026-01-01', 'date_to' => '2026-12-31']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data', fn ($data) => collect($data)->pluck('name')->all() === ['New Order'])
        );
});

it('filters orders by a search term across name, email, and transaction id', function () {
    createTestOrder(['name' => 'Searchable Customer', 'email' => 'findme@example.com', 'transaction_id' => 'unique-txn-1']);
    createTestOrder(['name' => 'Other Customer', 'email' => 'other@example.com', 'transaction_id' => 'unique-txn-2']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.orders.index', ['search' => 'findme']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data', fn ($data) => collect($data)->pluck('email')->all() === ['findme@example.com'])
        );
});

it('filters orders by customer name, email, or phone', function () {
    createTestOrder(['name' => 'Searchable Person', 'email' => 'findme@example.com', 'phone' => '0123456789']);
    createTestOrder(['name' => 'Other Person', 'email' => 'other@example.com', 'phone' => '0987654321']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.orders.index', ['customer' => 'findme']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data', fn ($data) => collect($data)->pluck('name')->all() === ['Searchable Person'])
            ->where('filters.customer', 'findme')
        );
});

it('filters orders by transaction id', function () {
    createTestOrder(['name' => 'Match Order', 'transaction_id' => 'match-12345']);
    createTestOrder(['name' => 'Other Order', 'transaction_id' => 'other-99999']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.orders.index', ['transaction_id' => 'match']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data', fn ($data) => collect($data)->pluck('name')->all() === ['Match Order'])
        );
});

it('filters orders by category', function () {
    createTestOrder(['name' => 'Design Order', 'category' => 'graphic-design']);
    createTestOrder(['name' => 'Dev Order', 'category' => 'web-development']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.orders.index', ['category' => 'graphic-design']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data', fn ($data) => collect($data)->pluck('name')->all() === ['Design Order'])
        );
});

it('filters orders by subcategory', function () {
    $subcategory = PortfolioSubCategory::factory()->create(['category_slug' => 'graphic-design']);
    $otherSubcategory = PortfolioSubCategory::factory()->create(['category_slug' => 'web-development']);

    createTestOrder(['name' => 'Matching Order', 'subcategory_id' => $subcategory->id]);
    createTestOrder(['name' => 'Other Order', 'subcategory_id' => $otherSubcategory->id]);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.orders.index', ['subcategory_id' => $subcategory->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data', fn ($data) => collect($data)->pluck('name')->all() === ['Matching Order'])
        );
});

it('filters orders by an amount range', function () {
    createTestOrder(['name' => 'Cheap Order', 'amount' => 50]);
    createTestOrder(['name' => 'Mid Order', 'amount' => 150]);
    createTestOrder(['name' => 'Expensive Order', 'amount' => 500]);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.orders.index', ['amount_min' => 100, 'amount_max' => 200]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data', fn ($data) => collect($data)->pluck('name')->all() === ['Mid Order'])
        );
});

it('exposes filter options for orders', function () {
    PortfolioSubCategory::factory()->create(['category_slug' => 'graphic-design', 'name' => 'Logo Design']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.orders.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filterOptions.categories', fn ($categories) => collect($categories)->pluck('slug')->contains('graphic-design'))
            ->where('filterOptions.subcategories', fn ($subcategories) => collect($subcategories)->pluck('name')->contains('Logo Design'))
        );
});

it('includes the linked transaction\'s order number for each order', function () {
    $transaction = Transaction::create([
        'name' => 'Order Customer',
        'email' => 'order@example.com',
        'amount' => 100,
        'status' => 'Processing',
        'transaction_id' => 'order-number-txn',
    ]);

    createTestOrder(['name' => 'Order With Number', 'transaction_id' => 'order-number-txn']);
    createTestOrder(['name' => 'Order Without Transaction', 'transaction_id' => 'no-matching-txn']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->get(route('admin.orders.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('orders.data', function ($data) use ($transaction) {
                $byName = collect($data)->keyBy('name');

                return $byName->get('Order With Number')['order_number'] === $transaction->order_number
                    && $byName->get('Order Without Transaction')['order_number'] === null;
            })
        );
});

it('rejects erasing orders without the mother admin password', function () {
    $orderId = createTestOrder(['status' => 'Pending']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->delete(route('admin.orders.erase'), ['status' => 'Pending'])
        ->assertSessionHasErrors(['password']);

    $this->assertDatabaseHas('orders', ['id' => $orderId]);
});

it('rejects erasing orders with an incorrect mother admin password', function () {
    $orderId = createTestOrder(['status' => 'Pending']);

    $this->actingAs($this->motherAdmin, 'admin')
        ->delete(route('admin.orders.erase'), ['status' => 'Pending', 'password' => 'wrong-password'])
        ->assertSessionHasErrors(['password']);

    $this->assertDatabaseHas('orders', ['id' => $orderId]);
});

it('erases pending orders and their linked transactions using the mother admin password as a master key', function () {
    $regularAdmin = Admin::factory()->regular()->create(['password' => bcrypt('regular-secret')]);

    $pendingOrderId = createTestOrder(['status' => 'Pending', 'transaction_id' => 'linked-txn']);
    $processingOrderId = createTestOrder(['status' => 'Processing', 'transaction_id' => 'kept-txn']);

    Transaction::create([
        'name' => 'Linked Transaction',
        'email' => 'linked@example.com',
        'transaction_id' => 'linked-txn',
        'status' => 'Pending',
        'amount' => 50,
    ]);

    Transaction::create([
        'name' => 'Kept Transaction',
        'email' => 'kept@example.com',
        'transaction_id' => 'kept-txn',
        'status' => 'Processing',
        'amount' => 75,
    ]);

    $this->actingAs($regularAdmin, 'admin')
        ->delete(route('admin.orders.erase'), ['status' => 'Pending', 'password' => 'mother-secret'])
        ->assertRedirect();

    $this->assertDatabaseMissing('orders', ['id' => $pendingOrderId]);
    $this->assertDatabaseHas('orders', ['id' => $processingOrderId]);
    $this->assertDatabaseMissing('transactions', ['transaction_id' => 'linked-txn']);
    $this->assertDatabaseHas('transactions', ['transaction_id' => 'kept-txn']);
});

it('blocks guests from order management routes', function () {
    $this->get(route('admin.orders.index'))->assertRedirect(route('admin.login'));
    $this->delete(route('admin.orders.erase'), ['status' => 'Pending', 'password' => 'mother-secret'])
        ->assertRedirect(route('admin.login'));
});
