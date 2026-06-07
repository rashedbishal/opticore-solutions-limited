<?php

use App\Models\Admin;
use App\Models\Conversation;
use App\Models\Testimonial;
use App\Models\User;

/**
 * Closes authorization gaps not covered by AdminAuthorizationTest: it verifies
 * that both guests AND authenticated non-admin web users are rejected by the
 * Testimonial and Customer-Conversation admin routes (guard middleware: auth:admin).
 */
beforeEach(function () {
    $this->admin = Admin::factory()->create();
    $this->user = User::factory()->create();
});

function assertAdminRouteBlockedForGuestsAndUsers(string $method, string $url, User $user): void
{
    test()->{$method}($url)->assertRedirect(route('admin.login'));
    test()->actingAs($user)->{$method}($url)->assertRedirect(route('admin.login'));
}

// --- Testimonials ---

it('blocks guests and non-admin users from the testimonial index and form pages', function () {
    $testimonial = Testimonial::create([
        'name' => 'Guarded Client',
        'company' => 'Acme Inc',
        'role' => 'CEO',
        'rating' => 5,
        'comment' => 'A protected testimonial.',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    assertAdminRouteBlockedForGuestsAndUsers('get', route('admin.testimonials.index'), $this->user);
    assertAdminRouteBlockedForGuestsAndUsers('get', route('admin.testimonials.create'), $this->user);
    assertAdminRouteBlockedForGuestsAndUsers('get', route('admin.testimonials.edit', $testimonial), $this->user);
});

it('blocks guests and non-admin users from creating testimonials', function () {
    $payload = [
        'name' => 'Injected Client',
        'company' => 'Injected Co',
        'role' => 'CTO',
        'rating' => 5,
        'comment' => 'This should never be created.',
    ];

    $this->post(route('admin.testimonials.store'), $payload)->assertRedirect(route('admin.login'));
    $this->actingAs($this->user)->post(route('admin.testimonials.store'), $payload)->assertRedirect(route('admin.login'));

    $this->assertDatabaseMissing('testimonials', ['name' => 'Injected Client']);
});

it('blocks guests and non-admin users from updating and deleting testimonials', function () {
    $testimonial = Testimonial::create([
        'name' => 'Untouchable Client',
        'company' => 'Acme Inc',
        'role' => 'CEO',
        'rating' => 5,
        'comment' => 'Should remain unchanged.',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $updatePayload = [
        'name' => 'Hacked Name',
        'company' => $testimonial->company,
        'role' => $testimonial->role,
        'rating' => $testimonial->rating,
        'comment' => $testimonial->comment,
    ];

    $this->put(route('admin.testimonials.update', $testimonial), $updatePayload)->assertRedirect(route('admin.login'));
    $this->actingAs($this->user)->put(route('admin.testimonials.update', $testimonial), $updatePayload)->assertRedirect(route('admin.login'));

    $this->delete(route('admin.testimonials.destroy', $testimonial))->assertRedirect(route('admin.login'));
    $this->actingAs($this->user)->delete(route('admin.testimonials.destroy', $testimonial))->assertRedirect(route('admin.login'));

    expect($testimonial->fresh()->name)->toBe('Untouchable Client');
    $this->assertDatabaseHas('testimonials', ['id' => $testimonial->id]);
});

// --- Customer Conversations ---

it('blocks guests and non-admin users from the customer-conversations index and listing endpoints', function () {
    $client = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $client->id]);

    assertAdminRouteBlockedForGuestsAndUsers('get', route('admin.customer-conversations.index'), $this->user);
    assertAdminRouteBlockedForGuestsAndUsers('get', route('admin.customer-conversations.list'), $this->user);
    assertAdminRouteBlockedForGuestsAndUsers('get', route('admin.customer-conversations.messages', $conversation), $this->user);
});

it('blocks guests and non-admin users from sending, reading, and pinging on customer conversations', function () {
    $client = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $client->id]);

    $sendPayload = ['message' => 'Should never be sent by an outsider'];

    $this->postJson(route('admin.customer-conversations.send', $conversation), $sendPayload)->assertUnauthorized();
    $this->actingAs($this->user)->postJson(route('admin.customer-conversations.send', $conversation), $sendPayload)->assertUnauthorized();

    $this->postJson(route('admin.customer-conversations.read', $conversation))->assertUnauthorized();
    $this->actingAs($this->user)->postJson(route('admin.customer-conversations.read', $conversation))->assertUnauthorized();

    $this->postJson(route('admin.customer-conversations.ping'))->assertUnauthorized();
    $this->actingAs($this->user)->postJson(route('admin.customer-conversations.ping'))->assertUnauthorized();

    $this->assertDatabaseMissing('messages', ['message' => 'Should never be sent by an outsider']);
});

it('blocks guests and non-admin users from creating and deleting offers on customer conversations', function () {
    $client = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $client->id]);
    $offer = $conversation->offers()->create([
        'payment_type' => 'single',
        'description' => 'A guarded offer',
        'request_requirements' => true,
        'price' => 100,
        'delivery_days' => 5,
        'status' => 'pending',
        'offer_token' => 'guarded-offer-token',
    ]);
    $message = $conversation->messages()->create([
        'sender_type' => 'admin',
        'sender_id' => $this->admin->id,
        'message' => 'Carrying an offer',
        'offer_id' => $offer->id,
    ]);

    $offerPayload = [
        'payment_type' => 'single',
        'description' => 'Should never be created by an outsider',
        'request_requirements' => true,
        'price' => 50,
        'delivery_days' => 2,
    ];

    $this->postJson(route('admin.customer-conversations.offer.store', $conversation), $offerPayload)->assertUnauthorized();
    $this->actingAs($this->user)->postJson(route('admin.customer-conversations.offer.store', $conversation), $offerPayload)->assertUnauthorized();

    $this->deleteJson(route('admin.customer-conversations.offer.destroy', [$conversation, $message]))->assertUnauthorized();
    $this->actingAs($this->user)->deleteJson(route('admin.customer-conversations.offer.destroy', [$conversation, $message]))->assertUnauthorized();

    $this->assertDatabaseMissing('offers', ['description' => 'Should never be created by an outsider']);
    $this->assertDatabaseHas('offers', ['id' => $offer->id]);
    $this->assertDatabaseHas('messages', ['id' => $message->id]);
});
