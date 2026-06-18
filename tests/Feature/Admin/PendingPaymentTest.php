<?php

use App\Events\OfferDeleted;
use App\Events\PendingPaymentDeleted;
use App\Models\Admin;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

function createAcceptedSingleOffer(Conversation $conversation, array $attributes = [])
{
    return $conversation->offers()->create(array_merge([
        'payment_type' => 'single',
        'description' => 'A complete brand package',
        'request_requirements' => true,
        'price' => 250,
        'delivery_days' => 7,
        'status' => 'accepted',
        'offer_token' => 'token-'.uniqid(),
    ], $attributes));
}

it('lists pending payments for the conversation\'s user', function () {
    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);
    $offer = createAcceptedSingleOffer($conversation);

    $this->actingAs($this->admin, 'admin')
        ->getJson(route('admin.customer-conversations.pending-payments.index', $conversation))
        ->assertSuccessful()
        ->assertJsonPath('0.id', "offer-{$offer->id}")
        ->assertJsonPath('0.plan', 'Full Payment')
        ->assertJsonPath('0.amount', '250.00')
        ->assertJsonPath('0.currency', 'USD');
});

it('deletes a single-payment offer with the correct password and broadcasts both events', function () {
    Event::fake([OfferDeleted::class, PendingPaymentDeleted::class]);

    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);
    $offer = createAcceptedSingleOffer($conversation);

    $message = $conversation->messages()->create([
        'sender_type' => 'admin',
        'sender_id' => $this->admin->id,
        'message' => 'Sent an offer',
        'offer_id' => $offer->id,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->deleteJson(route('admin.customer-conversations.pending-payments.destroy', [$conversation, "offer-{$offer->id}"]), [
            'password' => 'password',
        ])
        ->assertSuccessful()
        ->assertJsonPath('deleted', true);

    $this->assertDatabaseMissing('offers', ['id' => $offer->id]);
    $this->assertDatabaseMissing('messages', ['id' => $message->id]);

    Event::assertDispatched(OfferDeleted::class);
    Event::assertDispatched(
        PendingPaymentDeleted::class,
        fn (PendingPaymentDeleted $event) => $event->userId === $user->id,
    );
});

it('deletes one milestone from a multi-milestone offer without touching the offer or its other milestone', function () {
    Event::fake([OfferDeleted::class, PendingPaymentDeleted::class]);

    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    $offer = $conversation->offers()->create([
        'payment_type' => 'milestone',
        'description' => 'A multi-phase web project',
        'request_requirements' => true,
        'status' => 'accepted',
        'offer_token' => 'token-'.uniqid(),
    ]);

    $milestoneOne = $offer->milestones()->create([
        'name' => 'Design Phase',
        'delivery_days' => 5,
        'price' => 100,
        'sort_order' => 0,
    ]);

    $milestoneTwo = $offer->milestones()->create([
        'name' => 'Development Phase',
        'delivery_days' => 10,
        'price' => 200,
        'sort_order' => 1,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->deleteJson(route('admin.customer-conversations.pending-payments.destroy', [
            $conversation,
            "offer-{$offer->id}-milestone-{$milestoneOne->id}",
        ]), ['password' => 'password'])
        ->assertSuccessful()
        ->assertJsonPath('deleted', true);

    $this->assertDatabaseMissing('offer_milestones', ['id' => $milestoneOne->id]);
    $this->assertDatabaseHas('offer_milestones', ['id' => $milestoneTwo->id]);
    $this->assertDatabaseHas('offers', ['id' => $offer->id]);

    Event::assertDispatched(PendingPaymentDeleted::class);
    Event::assertNotDispatched(OfferDeleted::class);
});

it('rejects deletion with an incorrect password', function () {
    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);
    $offer = createAcceptedSingleOffer($conversation);

    $this->actingAs($this->admin, 'admin')
        ->deleteJson(route('admin.customer-conversations.pending-payments.destroy', [$conversation, "offer-{$offer->id}"]), [
            'password' => 'wrong-password',
        ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'The password you entered is incorrect.');

    $this->assertDatabaseHas('offers', ['id' => $offer->id]);
});

it('prevents deleting an offer that belongs to a different conversation', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $conversationA = Conversation::query()->create(['user_id' => $userA->id]);
    $conversationB = Conversation::query()->create(['user_id' => $userB->id]);
    $offer = createAcceptedSingleOffer($conversationA);

    $this->actingAs($this->admin, 'admin')
        ->deleteJson(route('admin.customer-conversations.pending-payments.destroy', [$conversationB, "offer-{$offer->id}"]), [
            'password' => 'password',
        ])
        ->assertStatus(404);

    $this->assertDatabaseHas('offers', ['id' => $offer->id]);
});

it('blocks guests from the pending payments endpoints', function () {
    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);
    $offer = createAcceptedSingleOffer($conversation);

    $this->getJson(route('admin.customer-conversations.pending-payments.index', $conversation))
        ->assertUnauthorized();

    $this->deleteJson(route('admin.customer-conversations.pending-payments.destroy', [$conversation, "offer-{$offer->id}"]), [
        'password' => 'password',
    ])->assertUnauthorized();
});
