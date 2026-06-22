<?php

use App\Mail\CustomMail;
use App\Models\Admin;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

it('rejects invalid email addresses in the custom email to/cc/bcc fields', function () {
    Mail::fake();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.subscriptions.custom-email.send'), [
            'subject' => 'Subject',
            'title' => 'Title',
            'body' => 'Body',
            'to' => 'not-an-email, also not one',
        ])
        ->assertInvalid(['to']);

    Mail::assertNothingSent();
});

it('rejects an invalid address mixed into an otherwise valid cc list', function () {
    Mail::fake();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.subscriptions.custom-email.send'), [
            'subject' => 'Subject',
            'title' => 'Title',
            'body' => 'Body',
            'to' => 'valid@example.com',
            'cc' => 'valid@example.com, not-an-email',
        ])
        ->assertInvalid(['cc']);

    Mail::assertNothingSent();
});

it('sends the custom email when every address is valid', function () {
    Mail::fake();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.subscriptions.custom-email.send'), [
            'subject' => 'Subject',
            'title' => 'Title',
            'body' => 'Body',
            'to' => 'first@example.com, second@example.com',
            'cc' => 'cc@example.com',
            'bcc' => 'bcc@example.com',
        ])
        ->assertRedirect();

    Mail::assertSent(CustomMail::class);
});
