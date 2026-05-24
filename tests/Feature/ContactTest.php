<?php

use App\Jobs\ProcessContactMessage;
use Illuminate\Support\Facades\Queue;

it('stores a contact submission and dispatches the processing job', function () {
    Queue::fake();

    $this->post(route('contactStore'), [
        'name' => 'Alice Smith',
        'email' => 'alice@example.com',
        'subject' => 'Project enquiry',
        'message' => 'I would like to discuss a project.',
    ])->assertRedirect();

    $this->assertDatabaseHas('contacts', [
        'name' => 'Alice Smith',
        'email' => 'alice@example.com',
    ]);

    Queue::assertPushed(ProcessContactMessage::class, function (ProcessContactMessage $job) {
        return $job->contact->email === 'alice@example.com';
    });
});

it('validates required name field', function () {
    Queue::fake();

    $this->post(route('contactStore'), [
        'email' => 'alice@example.com',
        'message' => 'Hello.',
    ])->assertInvalid(['name']);

    Queue::assertNothingPushed();
});

it('validates required message field', function () {
    Queue::fake();

    $this->post(route('contactStore'), [
        'name' => 'Alice',
        'email' => 'alice@example.com',
    ])->assertInvalid(['message']);

    Queue::assertNothingPushed();
});

it('validates required email field', function () {
    Queue::fake();

    $this->post(route('contactStore'), [
        'name' => 'Alice',
        'message' => 'Hello.',
    ])->assertInvalid(['email']);

    Queue::assertNothingPushed();
});

it('rejects an invalid email format', function () {
    Queue::fake();

    $this->post(route('contactStore'), [
        'name' => 'Alice',
        'email' => 'not-an-email',
        'message' => 'Hello.',
    ])->assertInvalid(['email']);

    Queue::assertNothingPushed();
});

it('accepts a submission without a subject', function () {
    Queue::fake();

    $this->post(route('contactStore'), [
        'name' => 'Bob',
        'email' => 'bob@example.com',
        'message' => 'Just saying hi.',
    ])->assertRedirect();

    $this->assertDatabaseHas('contacts', ['name' => 'Bob', 'email' => 'bob@example.com']);
});

it('rejects a name exceeding 255 characters', function () {
    $this->post(route('contactStore'), [
        'name' => str_repeat('a', 256),
        'email' => 'alice@example.com',
        'message' => 'Hello.',
    ])->assertInvalid(['name']);
});
