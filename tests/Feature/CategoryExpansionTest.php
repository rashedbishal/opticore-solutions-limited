<?php

use App\Models\Category;
use App\Models\Conversation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('includes a newly added category in the shared categories prop and hire-us sub-categories', function () {
    Category::factory()->create([
        'slug' => 'photography',
        'label' => 'Photography',
    ]);

    $this->get(route('hireUs'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('HireUs')
            ->where('categories.photography.label', 'Photography')
            ->has('subCategories.photography')
        );
});

it('includes a newly added category in the shared categories prop on an offer page', function () {
    Category::factory()->create([
        'slug' => 'photography',
        'label' => 'Photography',
    ]);

    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);
    $offer = $conversation->offers()->create([
        'payment_type' => 'single',
        'description' => 'A custom offer for you',
        'request_requirements' => true,
        'price' => 150,
        'delivery_days' => 5,
        'status' => 'pending',
        'offer_token' => 'offer-token-'.uniqid(),
    ]);

    $this->actingAs($user)
        ->get(route('offer.show', $offer->offer_token))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Offer/Show')
            ->where('categories.photography.label', 'Photography')
        );
});
