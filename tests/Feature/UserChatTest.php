<?php

use App\Events\MessageSent;
use App\Events\MessageStatusUpdated;
use App\Events\UserPresenceUpdated;
use App\Mail\AdminChatMessageReceivedMail;
use App\Models\Admin;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('initializes a conversation for the authenticated user with its unread count', function () {
    $response = $this->actingAs($this->user)
        ->postJson(route('user.chat.init'))
        ->assertSuccessful()
        ->assertJsonStructure(['conversation' => ['id', 'user_id'], 'unread_count']);

    expect($response->json('conversation.user_id'))->toBe($this->user->id);
    expect($response->json('unread_count'))->toBe(0);

    $this->assertDatabaseHas('conversations', ['user_id' => $this->user->id]);
});

it('reuses the same conversation on repeated init calls and counts unread admin messages', function () {
    $first = $this->actingAs($this->user)->postJson(route('user.chat.init'))->assertSuccessful();
    $conversationId = $first->json('conversation.id');

    $conversation = Conversation::query()->findOrFail($conversationId);
    $conversation->messages()->create([
        'sender_type' => 'admin',
        'sender_id' => Admin::factory()->create()->id,
        'message' => 'Welcome! How can we help?',
    ]);

    $second = $this->actingAs($this->user)->postJson(route('user.chat.init'))->assertSuccessful();

    expect($second->json('conversation.id'))->toBe($conversationId);
    expect($second->json('unread_count'))->toBe(1);
    expect(Conversation::query()->where('user_id', $this->user->id)->count())->toBe(1);
});

it('fetches conversation messages for the owning user and marks admin messages as delivered', function () {
    Event::fake([MessageStatusUpdated::class]);

    $conversation = Conversation::query()->create(['user_id' => $this->user->id]);
    $message = $conversation->messages()->create([
        'sender_type' => 'admin',
        'sender_id' => Admin::factory()->create()->id,
        'message' => 'Hello from support',
    ]);

    $this->actingAs($this->user)
        ->getJson(route('user.chat.messages', $conversation))
        ->assertSuccessful()
        ->assertJsonPath('data.0.id', $message->id);

    expect($message->fresh()->delivered_at)->not->toBeNull();
    Event::assertDispatched(MessageStatusUpdated::class);
});

it('forbids a user from fetching another user’s conversation messages', function () {
    $owner = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $owner->id]);

    $this->actingAs($this->user)
        ->getJson(route('user.chat.messages', $conversation))
        ->assertForbidden();
});

it('sends a text message in the user’s own conversation and broadcasts it', function () {
    Event::fake([MessageSent::class]);
    Mail::fake();

    Cache::put('admin_online', true, now()->addMinutes(2));

    $conversation = Conversation::query()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->postJson(route('user.chat.send', $conversation), [
            'message' => 'Hi, I need help with my project',
        ])
        ->assertSuccessful()
        ->assertJsonPath('message', 'Hi, I need help with my project')
        ->assertJsonPath('sender_type', 'user');

    $this->assertDatabaseHas('messages', [
        'conversation_id' => $conversation->id,
        'sender_type' => 'user',
        'message' => 'Hi, I need help with my project',
    ]);

    expect($conversation->fresh()->last_message)->toBe('Hi, I need help with my project');

    Event::assertDispatched(MessageSent::class);
    Mail::assertNothingQueued();
});

it('queues an admin notification email when no admin is online', function () {
    Event::fake([MessageSent::class]);
    Mail::fake();

    $admin = Admin::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->postJson(route('user.chat.send', $conversation), [
            'message' => 'Is anyone there?',
        ])
        ->assertSuccessful();

    Mail::assertQueued(AdminChatMessageReceivedMail::class, function (AdminChatMessageReceivedMail $mail) use ($admin) {
        return $mail->hasTo($admin->email);
    });
});

it('forbids a user from sending a message into another user’s conversation', function () {
    $owner = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $owner->id]);

    $this->actingAs($this->user)
        ->postJson(route('user.chat.send', $conversation), ['message' => 'Sneaky message'])
        ->assertForbidden();

    $this->assertDatabaseMissing('messages', ['message' => 'Sneaky message']);
});

it('rejects sending an empty message with no attachment', function () {
    $conversation = Conversation::query()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->postJson(route('user.chat.send', $conversation), [])
        ->assertStatus(422)
        ->assertJsonPath('error', 'Message or attachment is required');
});

it('marks admin messages as read for the owning user', function () {
    Event::fake([MessageStatusUpdated::class]);

    $conversation = Conversation::query()->create(['user_id' => $this->user->id]);
    $message = $conversation->messages()->create([
        'sender_type' => 'admin',
        'sender_id' => Admin::factory()->create()->id,
        'message' => 'Please read this',
    ]);

    $this->actingAs($this->user)
        ->postJson(route('user.chat.read', $conversation))
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    $message->refresh();
    expect($message->delivered_at)->not->toBeNull();
    expect($message->read_at)->not->toBeNull();
});

it('forbids a user from marking another user’s conversation as read', function () {
    $owner = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $owner->id]);

    $this->actingAs($this->user)
        ->postJson(route('user.chat.read', $conversation))
        ->assertForbidden();
});

it('marks the user online via the ping endpoint and broadcasts presence', function () {
    Event::fake([UserPresenceUpdated::class]);

    $this->actingAs($this->user)
        ->postJson(route('user.chat.ping'))
        ->assertSuccessful()
        ->assertJsonPath('ok', true);

    expect(Cache::has("user_chat_online_{$this->user->id}"))->toBeTrue();

    Event::assertDispatched(UserPresenceUpdated::class, fn (UserPresenceUpdated $event) => $event->userId === $this->user->id && $event->online === true);
});

it('marks the user offline via the offline endpoint and broadcasts presence', function () {
    Event::fake([UserPresenceUpdated::class]);

    Cache::put("user_chat_online_{$this->user->id}", true, now()->addMinutes(2));

    $this->actingAs($this->user)
        ->postJson(route('user.chat.offline'))
        ->assertSuccessful()
        ->assertJsonPath('ok', true);

    expect(Cache::has("user_chat_online_{$this->user->id}"))->toBeFalse();

    Event::assertDispatched(UserPresenceUpdated::class, fn (UserPresenceUpdated $event) => $event->userId === $this->user->id && $event->online === false);
});

it('blocks guests from accessing any user chat route', function () {
    $conversation = Conversation::query()->create(['user_id' => $this->user->id]);

    $this->postJson(route('user.chat.init'))->assertUnauthorized();
    $this->getJson(route('user.chat.messages', $conversation))->assertUnauthorized();
    $this->postJson(route('user.chat.send', $conversation), ['message' => 'Hi'])->assertUnauthorized();
    $this->postJson(route('user.chat.read', $conversation))->assertUnauthorized();
    $this->postJson(route('user.chat.ping'))->assertUnauthorized();
    $this->postJson(route('user.chat.offline'))->assertUnauthorized();
});
