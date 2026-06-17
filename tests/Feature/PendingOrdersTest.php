<?php

use App\Models\Conversation;
use App\Models\Offer;
use App\Models\PortfolioSubCategory;
use App\Models\Transaction;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createAcceptedOfferForUser(User $user, array $overrides = []): Offer
{
    $conversation = Conversation::query()->firstOrCreate(['user_id' => $user->id]);

    return $conversation->offers()->create(array_merge([
        'payment_type' => 'single',
        'description' => 'A custom offer for you',
        'request_requirements' => true,
        'price' => 500,
        'delivery_days' => 5,
        'category_slug' => 'web-development',
        'status' => 'accepted',
        'offer_token' => 'offer-token-'.$user->id.'-'.uniqid(),
    ], $overrides));
}

function createPaidTransaction(User $user, ?string $category, ?int $subcategoryId, float $amount, string $status = 'Processing'): Transaction
{
    return Transaction::create([
        'name' => $user->name,
        'email' => $user->email,
        'category' => $category,
        'subcategory_id' => $subcategoryId,
        'transaction_id' => 'txn-'.uniqid(),
        'amount' => $amount,
        'currency' => 'USD',
        'status' => $status,
    ]);
}

function createConvertedCurrencyTransaction(User $user, ?string $category, ?int $subcategoryId, float $usdPrice, float $convertedAmount, string $status = 'Processing'): Transaction
{
    return Transaction::create([
        'name' => $user->name,
        'email' => $user->email,
        'category' => $category,
        'subcategory_id' => $subcategoryId,
        'checkout_url' => '/checkout?'.http_build_query([
            'service' => 'Service',
            'plan' => 'Full Payment',
            'price' => '$'.number_format($usdPrice, 2),
            'delivery' => '5 Days',
            'category' => $category ?? '',
            'subcategory' => '',
            'subcategory_id' => $subcategoryId ?? 0,
        ]),
        'transaction_id' => 'txn-'.uniqid(),
        'amount' => $convertedAmount,
        'currency' => 'BDT',
        'status' => $status,
    ]);
}

it('shows a pending order for an accepted single-payment offer', function () {
    $user = User::factory()->create();
    $subCategory = PortfolioSubCategory::factory()->create(['name' => 'Logo Design']);

    $offer = createAcceptedOfferForUser($user, [
        'sub_category_id' => $subCategory->id,
        'price' => 500,
        'delivery_days' => 7,
    ]);

    $this->actingAs($user)
        ->get(route('profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Profile')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.id', "offer-{$offer->id}")
            ->where('pendingOrders.0.service', 'Logo Design')
            ->where('pendingOrders.0.plan', 'Full Payment')
            ->where('pendingOrders.0.amount', '500.00')
            ->where('pendingOrders.0.currency', 'USD')
            ->where('pendingOrders.0.checkout_url', fn (string $url) => str_contains($url, '/checkout')
                && str_contains($url, 'offer_token='.$offer->offer_token)
            )
        );
});

it('does not show a pending order for an offer that has not been accepted', function () {
    $user = User::factory()->create();

    createAcceptedOfferForUser($user, ['status' => 'pending']);
    createAcceptedOfferForUser($user, ['status' => 'declined']);

    $this->actingAs($user)
        ->get(route('profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Profile')
            ->has('pendingOrders', 0)
        );
});

it('hides a single-payment offer from pending orders once it has been paid for', function () {
    $user = User::factory()->create();
    $subCategory = PortfolioSubCategory::factory()->create();

    $offer = createAcceptedOfferForUser($user, [
        'sub_category_id' => $subCategory->id,
        'price' => 500,
    ]);

    createPaidTransaction($user, $offer->category_slug, $subCategory->id, 500);

    $this->actingAs($user)
        ->get(route('profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Profile')
            ->has('pendingOrders', 0)
            ->has('orders', 1)
        );
});

it('hides a single-payment offer when the gateway charged a converted currency amount', function () {
    $user = User::factory()->create();
    $subCategory = PortfolioSubCategory::factory()->create();

    $offer = createAcceptedOfferForUser($user, [
        'sub_category_id' => $subCategory->id,
        'price' => 60,
    ]);

    createConvertedCurrencyTransaction($user, $offer->category_slug, $subCategory->id, 60, 7375);

    $this->actingAs($user)
        ->get(route('profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Profile')
            ->has('pendingOrders', 0)
            ->has('orders', 1)
        );
});

it('shows one pending order per milestone for an accepted milestone offer', function () {
    $user = User::factory()->create();
    $subCategory = PortfolioSubCategory::factory()->create();

    $offer = createAcceptedOfferForUser($user, [
        'payment_type' => 'milestone',
        'price' => null,
        'delivery_days' => null,
        'sub_category_id' => $subCategory->id,
    ]);

    $offer->milestones()->create(['name' => 'Wireframes', 'delivery_days' => 3, 'price' => 100, 'sort_order' => 0]);
    $offer->milestones()->create(['name' => 'Development', 'delivery_days' => 10, 'price' => 250, 'sort_order' => 1]);
    $offer->milestones()->create(['name' => 'Launch', 'delivery_days' => 2, 'price' => 150, 'sort_order' => 2]);

    $this->actingAs($user)
        ->get(route('profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Profile')
            ->has('pendingOrders', 3)
            ->where('pendingOrders.0.plan', 'Wireframes')
            ->where('pendingOrders.0.amount', '100.00')
            ->where('pendingOrders.1.plan', 'Development')
            ->where('pendingOrders.1.amount', '250.00')
            ->where('pendingOrders.2.plan', 'Launch')
            ->where('pendingOrders.2.amount', '150.00')
        );
});

it('only removes the paid milestone from pending orders, leaving the others', function () {
    $user = User::factory()->create();
    $subCategory = PortfolioSubCategory::factory()->create();

    $offer = createAcceptedOfferForUser($user, [
        'payment_type' => 'milestone',
        'price' => null,
        'delivery_days' => null,
        'sub_category_id' => $subCategory->id,
    ]);

    $offer->milestones()->create(['name' => 'Wireframes', 'delivery_days' => 3, 'price' => 100, 'sort_order' => 0]);
    $development = $offer->milestones()->create(['name' => 'Development', 'delivery_days' => 10, 'price' => 250, 'sort_order' => 1]);
    $offer->milestones()->create(['name' => 'Launch', 'delivery_days' => 2, 'price' => 150, 'sort_order' => 2]);

    createPaidTransaction($user, $offer->category_slug, $subCategory->id, (float) $development->price);

    $this->actingAs($user)
        ->get(route('profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Profile')
            ->has('pendingOrders', 2)
            ->where('pendingOrders.0.plan', 'Wireframes')
            ->where('pendingOrders.1.plan', 'Launch')
        );
});

it('uses ordinal matching when multiple milestones share the same price', function () {
    $user = User::factory()->create();
    $subCategory = PortfolioSubCategory::factory()->create();

    $offer = createAcceptedOfferForUser($user, [
        'payment_type' => 'milestone',
        'price' => null,
        'delivery_days' => null,
        'sub_category_id' => $subCategory->id,
    ]);

    $offer->milestones()->create(['name' => 'Phase One', 'delivery_days' => 3, 'price' => 100, 'sort_order' => 0]);
    $offer->milestones()->create(['name' => 'Phase Two', 'delivery_days' => 3, 'price' => 100, 'sort_order' => 1]);

    createPaidTransaction($user, $offer->category_slug, $subCategory->id, 100);

    $this->actingAs($user)
        ->get(route('profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Profile')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.plan', 'Phase Two')
        );
});

it('falls back to a humanized category name when the offer has no sub-category', function () {
    $user = User::factory()->create();

    $offer = createAcceptedOfferForUser($user, [
        'sub_category_id' => null,
        'category_slug' => 'web-development',
        'price' => 200,
    ]);

    $this->actingAs($user)
        ->get(route('profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Profile')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.id', "offer-{$offer->id}")
            ->where('pendingOrders.0.service', 'Web Development')
        );
});
