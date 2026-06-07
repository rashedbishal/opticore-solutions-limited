<?php

use App\Models\Admin;
use App\Models\ChatSession;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

function createChatSessionWithMessages(string $sessionId, int $messageCount = 2): ChatSession
{
    $session = ChatSession::query()->create([
        'session_id' => $sessionId,
        'title' => 'Session: '.$sessionId,
    ]);

    for ($i = 0; $i < $messageCount; $i++) {
        $session->messages()->create([
            'sender' => $i % 2 === 0 ? 'user' : 'ai',
            'content' => "Message {$i} for {$sessionId}",
        ]);
    }

    return $session;
}

it('lists chat sessions with message counts on the admin index page', function () {
    $session = createChatSessionWithMessages('session-list-1', 3);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.chats.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Chat/Index')
            ->where('sessions.data.0.id', $session->id)
            ->where('sessions.data.0.messages_count', 3)
        );
});

it('shows a chat session with its messages and the session list', function () {
    $session = createChatSessionWithMessages('session-show-1', 2);
    createChatSessionWithMessages('session-show-2', 1);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.chats.show', $session))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Chat/Show')
            ->where('chatSession.id', $session->id)
            ->has('chatSession.messages', 2)
            ->has('sessions', 2)
        );
});

it('deletes a chat session and its messages', function () {
    $session = createChatSessionWithMessages('session-delete-1', 2);
    $messageIds = $session->messages()->pluck('id');

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.chats.destroy', $session))
        ->assertRedirect(route('admin.chats.index'));

    $this->assertDatabaseMissing('chat_sessions', ['id' => $session->id]);
    foreach ($messageIds as $messageId) {
        $this->assertDatabaseMissing('chat_messages', ['id' => $messageId]);
    }
});

it('blocks guests and non-admin users from chat session management routes', function () {
    $session = createChatSessionWithMessages('session-guard-1', 1);
    $user = User::factory()->create();

    $this->get(route('admin.chats.index'))->assertRedirect(route('admin.login'));
    $this->get(route('admin.chats.show', $session))->assertRedirect(route('admin.login'));
    $this->delete(route('admin.chats.destroy', $session))->assertRedirect(route('admin.login'));

    $this->actingAs($user)->get(route('admin.chats.index'))->assertRedirect(route('admin.login'));
    $this->actingAs($user)->delete(route('admin.chats.destroy', $session))->assertRedirect(route('admin.login'));

    $this->assertDatabaseHas('chat_sessions', ['id' => $session->id]);
});
