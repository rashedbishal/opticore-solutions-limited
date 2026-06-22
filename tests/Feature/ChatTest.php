<?php

use App\Models\ChatSession;

beforeEach(function () {
    // Defensively disable the Groq fallback so the controller never attempts a real HTTP call.
    config(['services.groq.key' => null]);
});

it('replies with the rule-based services overview and persists the conversation', function () {
    $response = $this->postJson(route('chat'), [
        'message' => 'What services do you offer?',
    ])
        ->assertSuccessful()
        ->assertJsonStructure(['reply', 'session_id']);

    expect($response->json('reply'))->toContain('We offer 5 core services');

    $sessionId = $response->json('session_id');
    $session = ChatSession::query()->where('session_id', $sessionId)->firstOrFail();

    expect($session->messages)->toHaveCount(2);
    expect($session->messages->firstWhere('sender', 'user')->content)->toBe('What services do you offer?');
    expect($session->messages->firstWhere('sender', 'ai')->content)->toContain('We offer 5 core services');
});

it('replies with details about a specific service when it is mentioned', function () {
    $response = $this->postJson(route('chat'), [
        'message' => "I'd like to know about graphic design.",
    ])->assertSuccessful();

    expect($response->json('reply'))
        ->toContain('Graphic Design')
        ->toContain('Logo & Brand Identity');
});

it('replies with company information when asked who they are', function () {
    $response = $this->postJson(route('chat'), [
        'message' => 'Who are you?',
    ])->assertSuccessful();

    expect($response->json('reply'))->toBe('A modern digital agency offering creative and technical services. We focus on high-quality design, strategic marketing, modern web solutions, and client satisfaction. Our goal is to help businesses grow with creative and digital solutions.');
});

it('replies with contact information when asked how to get in touch', function () {
    $response = $this->postJson(route('chat'), [
        'message' => 'How can I contact you?',
    ])->assertSuccessful();

    expect($response->json('reply'))
        ->toContain('You can reach us via:')
        ->toContain('hello@opticoresolutions.com');
});

it('continues the same chat session across requests from the same browser', function () {
    $first = $this->postJson(route('chat'), ['message' => 'Hello there'])
        ->assertSuccessful();

    $sessionId = $first->json('session_id');

    // No session_id is sent here — continuity now comes entirely from this
    // test client's own (cookie-carried) session, never from client input.
    $this->postJson(route('chat'), [
        'message' => 'What services do you offer?',
    ])->assertSuccessful()
        ->assertJsonPath('session_id', $sessionId);

    expect(ChatSession::query()->where('session_id', $sessionId)->count())->toBe(1);

    $session = ChatSession::query()->where('session_id', $sessionId)->firstOrFail();
    expect($session->messages)->toHaveCount(4);
});

it('generates a new session id when none exists yet', function () {
    $response = $this->postJson(route('chat'), ['message' => 'Hello there'])
        ->assertSuccessful();

    expect($response->json('session_id'))->toBeString()->not->toBeEmpty();
    expect(ChatSession::query()->where('session_id', $response->json('session_id'))->exists())->toBeTrue();
});

it("ignores a client-supplied session_id, so one visitor can never write into another visitor's chat", function () {
    $victimSession = ChatSession::query()->create(['session_id' => 'victim-session-id', 'title' => 'Victim chat']);
    $victimSession->messages()->create(['sender' => 'user', 'content' => 'Original victim message']);

    $response = $this->postJson(route('chat'), [
        'message' => 'Trying to hijack the victim session',
        'session_id' => 'victim-session-id',
    ])->assertSuccessful();

    expect($response->json('session_id'))->not->toBe('victim-session-id');

    $victimSession->refresh();
    expect($victimSession->messages)->toHaveCount(1);
});

it('falls back to a static reply when the message does not match any known topic and no AI key is configured', function () {
    $response = $this->postJson(route('chat'), [
        'message' => 'zibberish qwerty unrelated nonsense',
    ])->assertSuccessful();

    expect($response->json('reply'))->toBe("I'm having a little trouble connecting to my brain right now. Please try again or reach out to us directly at hello@opticoresolutions.com!");
});

it('rejects a chat message that is missing', function () {
    $this->postJson(route('chat'), [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['message']);
});

it('rejects a chat message exceeding the maximum length', function () {
    $this->postJson(route('chat'), [
        'message' => str_repeat('a', 2001),
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['message']);
});
