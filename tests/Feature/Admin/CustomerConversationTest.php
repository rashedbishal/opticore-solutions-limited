<?php

use App\Events\ConversationDeleted;
use App\Events\MessageSent;
use App\Events\OfferDeleted;
use App\Mail\ChatMessageReceivedMail;
use App\Models\Admin;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

it('renders the customer conversations index page', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.customer-conversations.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/CustomerChat/Index'));
});

it('lists conversations with unread counts and online status', function () {
    $user = User::factory()->create(['name' => 'Searchable Client']);
    $conversation = Conversation::query()->create(['user_id' => $user->id]);
    $conversation->messages()->create([
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'message' => 'Unread message',
    ]);

    Cache::put("user_chat_online_{$user->id}", true, now()->addMinutes(2));

    $this->actingAs($this->admin, 'admin')
        ->getJson(route('admin.customer-conversations.list'))
        ->assertSuccessful()
        ->assertJsonPath('data.0.id', $conversation->id)
        ->assertJsonPath('data.0.unread_count', 1)
        ->assertJsonPath('data.0.is_online', true);
});

it('still includes the client name/email after the client deletes their own account', function () {
    $user = User::factory()->create(['name' => 'Soon Gone']);
    $conversation = Conversation::query()->create(['user_id' => $user->id]);
    $user->delete();

    expect($user->trashed())->toBeTrue();

    $this->actingAs($this->admin, 'admin')
        ->getJson(route('admin.customer-conversations.list'))
        ->assertSuccessful()
        ->assertJsonPath('data.0.id', $conversation->id)
        ->assertJsonPath('data.0.user.name', 'Soon Gone');
});

it('filters conversations by client name search', function () {
    $matching = User::factory()->create(['name' => 'Findable Person']);
    $other = User::factory()->create(['name' => 'Different Person']);
    Conversation::query()->create(['user_id' => $matching->id]);
    Conversation::query()->create(['user_id' => $other->id]);

    $this->actingAs($this->admin, 'admin')
        ->getJson(route('admin.customer-conversations.list', ['search' => 'Findable']))
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.user.name', 'Findable Person');
});

it('fetches conversation messages and marks user messages as delivered', function () {
    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);
    $message = $conversation->messages()->create([
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'message' => 'Hello admin',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->getJson(route('admin.customer-conversations.messages', $conversation))
        ->assertSuccessful()
        ->assertJsonPath('data.0.id', $message->id);

    expect($message->fresh()->delivered_at)->not->toBeNull();
});

it('sends a text message from the admin to the conversation and broadcasts it', function () {
    Event::fake([MessageSent::class]);
    Mail::fake();

    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    $this->actingAs($this->admin, 'admin')
        ->postJson(route('admin.customer-conversations.send', $conversation), [
            'message' => 'Hello from support',
        ])
        ->assertSuccessful()
        ->assertJsonPath('message', 'Hello from support')
        ->assertJsonPath('sender_type', 'admin');

    $this->assertDatabaseHas('messages', [
        'conversation_id' => $conversation->id,
        'sender_type' => 'admin',
        'message' => 'Hello from support',
    ]);

    expect($conversation->fresh()->last_message)->toBe('Hello from support');

    Event::assertDispatched(MessageSent::class);
});

it('queues a notification email when the user is offline', function () {
    Event::fake([MessageSent::class]);
    Mail::fake();

    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    $this->actingAs($this->admin, 'admin')
        ->postJson(route('admin.customer-conversations.send', $conversation), [
            'message' => 'Are you there?',
        ])
        ->assertSuccessful();

    Mail::assertQueued(ChatMessageReceivedMail::class, function (ChatMessageReceivedMail $mail) use ($user) {
        return $mail->hasTo($user->email);
    });
});

it('does not queue a notification email when the client deleted their own account', function () {
    Event::fake([MessageSent::class]);
    Mail::fake();

    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);
    $user->delete();

    $this->actingAs($this->admin, 'admin')
        ->postJson(route('admin.customer-conversations.send', $conversation), [
            'message' => 'Are you there?',
        ])
        ->assertSuccessful();

    Mail::assertNothingQueued();
});

it('does not queue a notification email when the user is online', function () {
    Event::fake([MessageSent::class]);
    Mail::fake();

    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);
    Cache::put("user_chat_online_{$user->id}", true, now()->addMinutes(2));

    $this->actingAs($this->admin, 'admin')
        ->postJson(route('admin.customer-conversations.send', $conversation), [
            'message' => 'Glad you are online',
        ])
        ->assertSuccessful();

    Mail::assertNothingQueued();
});

it('rejects sending an empty message with no attachment', function () {
    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    $this->actingAs($this->admin, 'admin')
        ->postJson(route('admin.customer-conversations.send', $conversation), [])
        ->assertStatus(422)
        ->assertJsonPath('error', 'Message or attachment is required');
});

it('marks conversation messages as read', function () {
    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);
    $message = $conversation->messages()->create([
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'message' => 'Please read me',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->postJson(route('admin.customer-conversations.read', $conversation))
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    expect($message->fresh()->read_at)->not->toBeNull();
});

it('marks the admin as online via the ping endpoint', function () {
    expect(Cache::has('admin_online'))->toBeFalse();

    $this->actingAs($this->admin, 'admin')
        ->postJson(route('admin.customer-conversations.ping'))
        ->assertSuccessful()
        ->assertJsonPath('ok', true);

    expect(Cache::has('admin_online'))->toBeTrue();
});

it('creates a single-payment offer in the conversation and broadcasts it', function () {
    Event::fake([MessageSent::class]);

    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    $response = $this->actingAs($this->admin, 'admin')
        ->postJson(route('admin.customer-conversations.offer.store', $conversation), [
            'payment_type' => 'single',
            'description' => 'A complete brand package',
            'request_requirements' => true,
            'price' => 250,
            'delivery_days' => 7,
        ])
        ->assertSuccessful();

    $response->assertJsonPath('offer.payment_type', 'single')
        ->assertJsonPath('offer.price', '250.00');

    $this->assertDatabaseHas('offers', [
        'conversation_id' => $conversation->id,
        'payment_type' => 'single',
        'price' => 250,
    ]);

    Event::assertDispatched(MessageSent::class);
});

it('creates a milestone offer with milestones in the conversation', function () {
    Event::fake([MessageSent::class]);

    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    $response = $this->actingAs($this->admin, 'admin')
        ->postJson(route('admin.customer-conversations.offer.store', $conversation), [
            'payment_type' => 'milestone',
            'description' => 'A multi-phase web project',
            'request_requirements' => true,
            'milestones' => [
                ['name' => 'Design Phase', 'delivery_days' => 5, 'price' => 100],
                ['name' => 'Development Phase', 'delivery_days' => 10, 'price' => 200],
            ],
        ])
        ->assertSuccessful();

    $offerId = $response->json('offer.id');

    $this->assertDatabaseHas('offers', [
        'id' => $offerId,
        'payment_type' => 'milestone',
    ]);
    $this->assertDatabaseCount('offer_milestones', 2);
    $this->assertDatabaseHas('offer_milestones', ['offer_id' => $offerId, 'name' => 'Design Phase']);
    $this->assertDatabaseHas('offer_milestones', ['offer_id' => $offerId, 'name' => 'Development Phase']);
});

it('rejects an offer without milestones when payment type is milestone', function () {
    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    $this->actingAs($this->admin, 'admin')
        ->postJson(route('admin.customer-conversations.offer.store', $conversation), [
            'payment_type' => 'milestone',
            'description' => 'Missing milestones',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['milestones']);
});

it('deletes an offer message and broadcasts the deletion', function () {
    Event::fake([OfferDeleted::class]);

    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    $offer = $conversation->offers()->create([
        'payment_type' => 'single',
        'description' => 'Removable offer',
        'request_requirements' => true,
        'price' => 80,
        'delivery_days' => 3,
        'status' => 'pending',
        'offer_token' => 'removable-offer-token',
    ]);

    $message = $conversation->messages()->create([
        'sender_type' => 'admin',
        'sender_id' => $this->admin->id,
        'message' => 'Sent an offer',
        'offer_id' => $offer->id,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->deleteJson(route('admin.customer-conversations.offer.destroy', [$conversation, $message]))
        ->assertSuccessful()
        ->assertJsonPath('message_id', $message->id);

    $this->assertDatabaseMissing('messages', ['id' => $message->id]);
    $this->assertDatabaseMissing('offers', ['id' => $offer->id]);

    Event::assertDispatched(OfferDeleted::class);
});

it('rejects deleting a message that has no associated offer', function () {
    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    $message = $conversation->messages()->create([
        'sender_type' => 'admin',
        'sender_id' => $this->admin->id,
        'message' => 'Just a regular message',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->deleteJson(route('admin.customer-conversations.offer.destroy', [$conversation, $message]))
        ->assertStatus(422);

    $this->assertDatabaseHas('messages', ['id' => $message->id]);
});

it('deletes a conversation, its messages, offers, and attachments, then broadcasts the deletion', function () {
    Event::fake([ConversationDeleted::class]);
    Storage::fake('local');

    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    $path = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf')
        ->store('chat_attachments', 'local');

    $message = $conversation->messages()->create([
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'message' => 'Here is a file',
        'attachment_path' => $path,
        'attachment_type' => 'document',
    ]);

    $offer = $conversation->offers()->create([
        'payment_type' => 'single',
        'description' => 'An offer tied to this conversation',
        'request_requirements' => true,
        'price' => 100,
        'delivery_days' => 5,
        'status' => 'pending',
        'offer_token' => 'conversation-delete-offer-token',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->deleteJson(route('admin.customer-conversations.destroy', $conversation), [
            'password' => 'password',
        ])
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    $this->assertDatabaseMissing('conversations', ['id' => $conversation->id]);
    $this->assertDatabaseMissing('messages', ['id' => $message->id]);
    $this->assertDatabaseMissing('offers', ['id' => $offer->id]);
    Storage::disk('local')->assertMissing($path);

    Event::assertDispatched(
        ConversationDeleted::class,
        fn (ConversationDeleted $event) => $event->conversationId === $conversation->id,
    );
});

it('rejects deleting a conversation with an incorrect password', function () {
    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    $this->actingAs($this->admin, 'admin')
        ->deleteJson(route('admin.customer-conversations.destroy', $conversation), [
            'password' => 'wrong-password',
        ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'The password you entered is incorrect.');

    $this->assertDatabaseHas('conversations', ['id' => $conversation->id]);
});

it('allows a regular admin to delete a conversation using the mother admin password', function () {
    $regularAdmin = Admin::factory()->withPermissions(['customer-conversations'])->create();

    $user = User::factory()->create();
    $conversation = Conversation::query()->create(['user_id' => $user->id]);

    $this->actingAs($regularAdmin, 'admin')
        ->deleteJson(route('admin.customer-conversations.destroy', $conversation), [
            'password' => 'password',
        ])
        ->assertSuccessful();

    $this->assertDatabaseMissing('conversations', ['id' => $conversation->id]);
});
