<?php

use App\Events\MessageStatusUpdated;
use App\Models\Admin;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Event;

it('marks admin messages as delivered when the user fetches them', function () {
    Event::fake([MessageStatusUpdated::class]);

    $user = User::factory()->create();
    $conversation = Conversation::query()->create([
        'user_id' => $user->id,
    ]);
    $message = $conversation->messages()->create([
        'sender_type' => 'admin',
        'sender_id' => 1,
        'message' => 'Hello from admin',
    ]);

    $this->actingAs($user)
        ->getJson(route('user.chat.messages', $conversation))
        ->assertSuccessful();

    expect($message->fresh())
        ->delivered_at->not->toBeNull()
        ->read_at->toBeNull();

    Event::assertDispatched(MessageStatusUpdated::class, function (MessageStatusUpdated $event) use ($conversation, $message) {
        return $event->conversationId === $conversation->id
            && collect($event->messages)->contains(fn (array $status) => $status['id'] === $message->id && $status['delivered_at'] !== null && $status['read_at'] === null);
    });
});

it('marks admin messages as seen when the user reads them', function () {
    Event::fake([MessageStatusUpdated::class]);

    $user = User::factory()->create();
    $conversation = Conversation::query()->create([
        'user_id' => $user->id,
    ]);
    $message = $conversation->messages()->create([
        'sender_type' => 'admin',
        'sender_id' => 1,
        'message' => 'Seen by user',
    ]);

    $this->actingAs($user)
        ->postJson(route('user.chat.read', $conversation))
        ->assertSuccessful();

    $message = $message->fresh();

    expect($message->delivered_at)->not->toBeNull()
        ->and($message->read_at)->not->toBeNull();

    Event::assertDispatched(MessageStatusUpdated::class, function (MessageStatusUpdated $event) use ($conversation, $message) {
        return $event->conversationId === $conversation->id
            && collect($event->messages)->contains(fn (array $status) => $status['id'] === $message->id && $status['delivered_at'] !== null && $status['read_at'] !== null);
    });
});

it('marks user messages as delivered when an admin fetches them', function () {
    Event::fake([MessageStatusUpdated::class]);

    $admin = Admin::factory()->create();
    $user = User::factory()->create();
    $conversation = Conversation::query()->create([
        'user_id' => $user->id,
    ]);
    $message = $conversation->messages()->create([
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'message' => 'Hello from user',
    ]);

    $this->actingAs($admin, 'admin')
        ->getJson(route('admin.customer-conversations.messages', $conversation))
        ->assertSuccessful();

    expect($message->fresh())
        ->delivered_at->not->toBeNull()
        ->read_at->toBeNull();

    Event::assertDispatched(MessageStatusUpdated::class, function (MessageStatusUpdated $event) use ($conversation, $message) {
        return $event->conversationId === $conversation->id
            && collect($event->messages)->contains(fn (array $status) => $status['id'] === $message->id && $status['delivered_at'] !== null && $status['read_at'] === null);
    });
});

it('marks user messages as seen when an admin reads them', function () {
    Event::fake([MessageStatusUpdated::class]);

    $admin = Admin::factory()->create();
    $user = User::factory()->create();
    $conversation = Conversation::query()->create([
        'user_id' => $user->id,
    ]);
    $message = $conversation->messages()->create([
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'message' => 'Seen by admin',
    ]);

    $this->actingAs($admin, 'admin')
        ->postJson(route('admin.customer-conversations.read', $conversation))
        ->assertSuccessful();

    $message = $message->fresh();

    expect($message->delivered_at)->not->toBeNull()
        ->and($message->read_at)->not->toBeNull();

    Event::assertDispatched(MessageStatusUpdated::class, function (MessageStatusUpdated $event) use ($conversation, $message) {
        return $event->conversationId === $conversation->id
            && collect($event->messages)->contains(fn (array $status) => $status['id'] === $message->id && $status['delivered_at'] !== null && $status['read_at'] !== null);
    });
});
