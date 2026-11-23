<?php

require_once __DIR__.'/ChannelHelpers.php';
require_once __DIR__.'/FakeImap.php';

use App\Leads\Enums\FailedEmailMessageStatus;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Jobs\ProcessEmailLeadSource;
use App\Leads\Mail\ImapClient;
use App\Leads\Models\FailedEmailMessage;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadAttachment;
use App\Leads\Models\LeadSource;
use App\Leads\Notifications\InboxCannotConnectNotification;
use App\Leads\Notifications\NewLeadNotification;
use App\Models\Admin;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function emailSource(): LeadSource
{
    return LeadSource::create(['type' => LeadSourceType::Email, 'name' => 'Sales inbox', 'is_active' => true, 'config' => [
        'email_address' => 'sales@opticore.test', 'imap_host' => 'imap.test', 'imap_port' => 993,
        'imap_username' => 'sales@opticore.test', 'imap_password' => 'secret', 'fetch_interval_minutes' => 15,
    ]]);
}

beforeEach(function () {
    $this->imap = new FakeImapClient;
    app()->instance(ImapClient::class, $this->imap);
    Storage::fake('local');
});

it('turns a new email into a lead and marks it read', function () {
    Notification::fake();
    $manager = Admin::factory()->leadManager()->create();
    $source = emailSource();
    $this->imap->addEmail('karim@example.com', 'Karim Uddin', 'Quote please', 'We need a website.', '<p>We need a <b>website</b>.</p>');

    ProcessEmailLeadSource::dispatchSync($source);

    $lead = Lead::sole();

    expect($lead->name)->toBe('Karim Uddin')
        ->and($lead->email)->toBe('karim@example.com')
        ->and($lead->message)->toBe('We need a website.')
        ->and($lead->html_body)->toContain('<b>website</b>')
        ->and($lead->source_data['subject'])->toBe('Quote please')
        ->and($this->imap->messages[1]['seen'])->toBeTrue()
        ->and($source->fresh()->last_synced_at)->not->toBeNull();

    Notification::assertSentTo($manager, NewLeadNotification::class);
});

it('adds a sender\'s next email to their existing lead, and saves attachments', function () {
    $source = emailSource();
    $this->imap->addEmail('karim@example.com', 'Karim Uddin', 'Hi', 'First');
    ProcessEmailLeadSource::dispatchSync($source);

    $this->imap->addEmail('karim@example.com', 'Karim Uddin', 'Re: Hi', 'Second', attachments: [['name' => 'logo.png', 'bytes' => 'png-bytes']]);
    ProcessEmailLeadSource::dispatchSync($source);

    $lead = Lead::sole();
    $attachment = LeadAttachment::sole();

    expect($lead->message)->toBe("First\nSecond")
        ->and($attachment->lead_id)->toBe($lead->id)
        ->and($attachment->mime)->toBe('image/png');
    Storage::disk('local')->assertExists($attachment->path);
});

it('records an unreadable email for retry instead of losing it', function () {
    $source = emailSource();
    $number = $this->imap->addEmail('a@example.com', null, 'x', 'y');
    $this->imap->messages[$number]['header'] = false;

    ProcessEmailLeadSource::dispatchSync($source);

    expect(FailedEmailMessage::sole())
        ->status->toBe(FailedEmailMessageStatus::Failed)
        ->failure_class->toBe('permanent_unreadable_header')
        ->and($this->imap->messages[$number]['seen'])->toBeTrue();
});

it('retries a failed email and marks it recovered', function () {
    $source = emailSource();
    $number = $this->imap->addEmail('late@example.com', 'Late Person', 'Hello', 'Body');
    $record = FailedEmailMessage::create([
        'lead_source_id' => $source->id, 'message_id' => '<msg1@test>', 'imap_uid' => $this->imap->messages[$number]['uid'],
        'uidvalidity' => 1, 'status' => FailedEmailMessageStatus::Failed, 'first_failed_at' => now(), 'next_retry_at' => now()->subMinute(),
    ]);

    ProcessEmailLeadSource::dispatchSync($source, [$record->id]);

    expect($record->fresh()->status)->toBe(FailedEmailMessageStatus::Recovered)
        ->and(Lead::sole()->email)->toBe('late@example.com');
});

it('alerts the mother admin once when an inbox keeps failing to connect', function () {
    Notification::fake();
    $mother = Admin::factory()->create();
    $source = emailSource();
    $this->imap->canConnect = false;

    foreach (range(1, 6) as $ignored) {
        ProcessEmailLeadSource::dispatchSync($source);
    }

    Notification::assertSentToTimes($mother, InboxCannotConnectNotification::class, 1);

    $this->actingAs($mother, 'admin')
        ->get(route('admin.leads.sources.index'))
        ->assertInertia(fn (Assert $page) => $page->where('sources', fn ($sources) => collect($sources)->firstWhere('id', $source->id)['health']['problems'][0]['problem'] === 'inbox_cannot_connect'));
});

it('only checks inboxes that are due', function () {
    Queue::fake();
    $due = emailSource();
    $notDue = emailSource();
    $notDue->update(['last_synced_at' => now()]);

    $this->artisan('leads:fetch-emails')->assertSuccessful();

    Queue::assertPushed(ProcessEmailLeadSource::class, fn ($job) => $job->source->is($due));
    Queue::assertNotPushed(ProcessEmailLeadSource::class, fn ($job) => $job->source->is($notDue));
});

it('deletes attachment files whose lead is gone', function () {
    $lead = Lead::factory()->create();
    Storage::disk('local')->put('leads/email/kept.png', 'x');
    Storage::disk('local')->put('leads/email/orphan.png', 'x');
    LeadAttachment::create(['lead_id' => $lead->id, 'type' => 'image', 'status' => 'downloaded', 'path' => 'leads/email/kept.png']);
    $this->travel(2)->hours();

    $this->artisan('leads:cleanup-attachments')->assertSuccessful();

    Storage::disk('local')->assertExists('leads/email/kept.png');
    Storage::disk('local')->assertMissing('leads/email/orphan.png');
});
