<?php

use App\Events\OfferStatusChanged;
use App\Events\OfferUpdated;
use App\Models\Admin;
use App\Models\Conversation;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;

function createOfferForUser(User $user, array $overrides = []): Offer
{
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    return $conversation->offers()->create(array_merge([
        'payment_type' => 'single',
        'description' => 'A custom offer for you',
        'request_requirements' => true,
        'price' => 150,
        'delivery_days' => 5,
        'status' => 'pending',
        'offer_token' => 'offer-token-'.$user->id.'-'.uniqid(),
    ], $overrides));
}

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

it('shows an offer to its owning client and allows them to respond while pending', function () {
    $user = User::factory()->create();
    $offer = createOfferForUser($user);

    $this->actingAs($user)
        ->get(route('offer.show', $offer->offer_token))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Offer/Show')
            ->where('offer.id', $offer->id)
            ->where('canRespond', true)
            ->where('isAdmin', false)
        );
});

it('shows an offer to any admin without allowing them to respond', function () {
    $user = User::factory()->create();
    $offer = createOfferForUser($user);

    $this->actingAs($this->admin, 'admin')
        ->get(route('offer.show', $offer->offer_token))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Offer/Show')
            ->where('offer.id', $offer->id)
            ->where('canRespond', false)
            ->where('isAdmin', true)
        );
});

it('still shows the client name to an admin after the client deletes their own account', function () {
    $user = User::factory()->create(['name' => 'Soon Gone']);
    $offer = createOfferForUser($user);
    $user->delete();

    $this->actingAs($this->admin, 'admin')
        ->get(route('offer.show', $offer->offer_token))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Offer/Show')
            ->where('offer.conversation.user.name', 'Soon Gone')
        );
});

it('forbids a different client from viewing someone else’s offer', function () {
    $owner = User::factory()->create();
    $offer = createOfferForUser($owner);

    $stranger = User::factory()->create();

    $this->actingAs($stranger)
        ->get(route('offer.show', $offer->offer_token))
        ->assertForbidden();
});

it('returns 404 for an unknown offer token', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('offer.show', 'does-not-exist-token'))
        ->assertNotFound();
});

it('automatically expires a pending offer once its expiry date has passed', function () {
    $user = User::factory()->create();
    $offer = createOfferForUser($user, [
        'status' => 'pending',
        'expires_at' => now()->subDay(),
    ]);

    $this->actingAs($user)
        ->get(route('offer.show', $offer->offer_token))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->where('offer.status', 'expired'));

    expect($offer->fresh()->status)->toBe('expired');
});

it('allows the owning client to accept a pending offer and broadcasts the status change', function () {
    Event::fake([OfferStatusChanged::class]);

    $user = User::factory()->create();
    $offer = createOfferForUser($user);

    $this->actingAs($user)
        ->postJson(route('offer.accept', $offer->offer_token))
        ->assertSuccessful()
        ->assertJsonPath('status', 'accepted')
        ->assertJsonPath('offer_id', $offer->id);

    expect($offer->fresh()->status)->toBe('accepted');

    Event::assertDispatched(OfferStatusChanged::class, fn (OfferStatusChanged $event) => $event->offer->id === $offer->id);
});

it('allows the owning client to decline a pending offer and broadcasts the status change', function () {
    Event::fake([OfferStatusChanged::class]);

    $user = User::factory()->create();
    $offer = createOfferForUser($user);

    $this->actingAs($user)
        ->postJson(route('offer.decline', $offer->offer_token))
        ->assertSuccessful()
        ->assertJsonPath('status', 'declined')
        ->assertJsonPath('offer_id', $offer->id);

    expect($offer->fresh()->status)->toBe('declined');

    Event::assertDispatched(OfferStatusChanged::class, fn (OfferStatusChanged $event) => $event->offer->id === $offer->id);
});

it('forbids a different client from accepting or declining someone else’s offer', function () {
    Event::fake([OfferStatusChanged::class]);

    $owner = User::factory()->create();
    $offer = createOfferForUser($owner);
    $stranger = User::factory()->create();

    $this->actingAs($stranger)->postJson(route('offer.accept', $offer->offer_token))->assertForbidden();
    $this->actingAs($stranger)->postJson(route('offer.decline', $offer->offer_token))->assertForbidden();

    expect($offer->fresh()->status)->toBe('pending');
    Event::assertNotDispatched(OfferStatusChanged::class);
});

it('rejects accepting or declining an offer that is no longer pending', function () {
    Event::fake([OfferStatusChanged::class]);

    $user = User::factory()->create();
    $offer = createOfferForUser($user, ['status' => 'accepted']);

    $this->actingAs($user)
        ->postJson(route('offer.accept', $offer->offer_token))
        ->assertStatus(422);

    $this->actingAs($user)
        ->postJson(route('offer.decline', $offer->offer_token))
        ->assertStatus(422);

    Event::assertNotDispatched(OfferStatusChanged::class);
});

it('blocks guests from accepting or declining an offer', function () {
    $user = User::factory()->create();
    $offer = createOfferForUser($user);

    $this->postJson(route('offer.accept', $offer->offer_token))->assertUnauthorized();
    $this->postJson(route('offer.decline', $offer->offer_token))->assertUnauthorized();
});

it('allows an admin to update an offer to a single payment and broadcasts the change', function () {
    Event::fake([OfferUpdated::class, OfferStatusChanged::class]);

    $user = User::factory()->create();
    $offer = createOfferForUser($user, ['payment_type' => 'single', 'price' => 100, 'delivery_days' => 3]);

    $this->actingAs($this->admin, 'admin')
        ->putJson(route('offer.update', $offer->offer_token), [
            'payment_type' => 'single',
            'description' => 'A revised single-payment offer',
            'request_requirements' => true,
            'price' => 300,
            'delivery_days' => 10,
        ])
        ->assertSuccessful()
        ->assertJsonPath('payment_type', 'single')
        ->assertJsonPath('status', 'pending');

    $offer->refresh();
    expect($offer->description)->toBe('A revised single-payment offer');
    expect((float) $offer->price)->toBe(300.0);
    expect($offer->delivery_days)->toBe(10);

    Event::assertDispatched(OfferUpdated::class);
    Event::assertDispatched(OfferStatusChanged::class);
});

it('allows an admin to convert an offer to milestones and replaces existing milestones', function () {
    Event::fake([OfferUpdated::class, OfferStatusChanged::class]);

    $user = User::factory()->create();
    $offer = createOfferForUser($user, ['payment_type' => 'single', 'price' => 100, 'delivery_days' => 3]);
    $offer->milestones()->create(['name' => 'Old Milestone', 'delivery_days' => 2, 'price' => 20, 'sort_order' => 0]);

    $response = $this->actingAs($this->admin, 'admin')
        ->putJson(route('offer.update', $offer->offer_token), [
            'payment_type' => 'milestone',
            'description' => 'Now broken into milestones',
            'request_requirements' => true,
            'milestones' => [
                ['name' => 'Phase One', 'delivery_days' => 4, 'price' => 60],
                ['name' => 'Phase Two', 'delivery_days' => 6, 'price' => 90],
            ],
        ])
        ->assertSuccessful();

    $offer->refresh();

    expect($offer->payment_type)->toBe('milestone');
    expect($offer->price)->toBeNull();
    expect($offer->delivery_days)->toBeNull();
    expect($offer->milestones)->toHaveCount(2);
    expect($offer->milestones->pluck('name')->all())->toBe(['Phase One', 'Phase Two']);
    $this->assertDatabaseMissing('offer_milestones', ['name' => 'Old Milestone']);
});

it('rejects an admin offer update missing required fields for the chosen payment type', function () {
    $user = User::factory()->create();
    $offer = createOfferForUser($user);

    $this->actingAs($this->admin, 'admin')
        ->putJson(route('offer.update', $offer->offer_token), [
            'payment_type' => 'single',
            'description' => 'Missing price and delivery days',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['price', 'delivery_days']);
});

it('blocks non-admin users from updating an offer', function () {
    $user = User::factory()->create();
    $offer = createOfferForUser($user);

    $this->actingAs($user)
        ->putJson(route('offer.update', $offer->offer_token), [
            'payment_type' => 'single',
            'description' => 'Trying to edit my own offer',
            'price' => 100,
            'delivery_days' => 5,
        ])
        ->assertUnauthorized();

    expect($offer->fresh()->description)->not->toBe('Trying to edit my own offer');
});

it('blocks a regular admin without the customer-conversations permission from updating an offer', function () {
    $admin = Admin::factory()->regular()->create();

    $user = User::factory()->create();
    $offer = createOfferForUser($user);

    $this->actingAs($admin, 'admin')
        ->putJson(route('offer.update', $offer->offer_token), [
            'payment_type' => 'single',
            'description' => 'Should be blocked',
            'price' => 100,
            'delivery_days' => 5,
        ])
        ->assertForbidden();

    expect($offer->fresh()->description)->not->toBe('Should be blocked');
});

it('allows a regular admin with the customer-conversations permission to update an offer', function () {
    $admin = Admin::factory()->withPermissions(['customer-conversations'])->create();

    $user = User::factory()->create();
    $offer = createOfferForUser($user);

    $this->actingAs($admin, 'admin')
        ->putJson(route('offer.update', $offer->offer_token), [
            'payment_type' => 'single',
            'description' => 'Approved update',
            'price' => 100,
            'delivery_days' => 5,
        ])
        ->assertSuccessful();

    expect($offer->fresh()->description)->toBe('Approved update');
});

it('logs out a regular admin instead of updating an offer when their permissions changed mid-session', function () {
    $admin = Admin::factory()->withPermissions(['customer-conversations'])->create();
    $staleStamp = $admin->securityStamp();

    $admin->forceFill(['permissions' => []])->save();

    $user = User::factory()->create();
    $offer = createOfferForUser($user);

    $response = $this->actingAs($admin->fresh(), 'admin')
        ->withSession(['admin_security_stamp' => $staleStamp])
        ->putJson(route('offer.update', $offer->offer_token), [
            'payment_type' => 'single',
            'description' => 'Should not apply',
            'price' => 100,
            'delivery_days' => 5,
        ]);

    $response->assertRedirect(route('admin.login'));
    expect(Auth::guard('admin')->check())->toBeFalse();
    expect($offer->fresh()->description)->not->toBe('Should not apply');
});
