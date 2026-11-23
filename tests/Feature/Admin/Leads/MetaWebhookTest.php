<?php

require_once __DIR__.'/ChannelHelpers.php';

use App\Leads\Enums\LeadSourceType;
use App\Leads\Jobs\DownloadLeadAttachment;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadAttachment;
use App\Leads\Models\LeadMessage;
use App\Leads\Notifications\NewLeadNotification;
use App\Models\Admin;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;

function messengerPayload(string $senderId, string $mid, ?string $text = 'Hello', array $extra = []): array
{
    return ['object' => 'page', 'entry' => [['id' => 'PAGE1', 'messaging' => [[
        'sender' => ['id' => $senderId],
        'recipient' => ['id' => 'PAGE1'],
        'timestamp' => now()->getTimestampMs(),
        'message' => ['mid' => $mid, 'text' => $text, ...$extra],
    ]]]]];
}

beforeEach(function () {
    Queue::fake([DownloadLeadAttachment::class]);
});

it('answers Meta\'s subscription check only with the right verify token', function () {
    metaSource(LeadSourceType::FacebookMessenger);

    $this->get('/api/webhook/facebook?hub_mode=subscribe&hub_verify_token=verify-me&hub_challenge=12345')
        ->assertOk()->assertSee('12345');

    $this->get('/api/webhook/facebook?hub_mode=subscribe&hub_verify_token=wrong&hub_challenge=12345')
        ->assertForbidden();
});

it('rejects a badly signed webhook and remembers it for the health warning', function () {
    $source = metaSource(LeadSourceType::FacebookMessenger, ['app_secret' => 'shh']);

    signedPost('/api/webhook/facebook', messengerPayload('PSID1', 'm1'), 'wrong-secret')->assertForbidden();

    expect(Lead::count())->toBe(0)
        ->and($source->fresh()->last_signature_rejection_at)->not->toBeNull();

    signedPost('/api/webhook/facebook', messengerPayload('PSID1', 'm1'), 'shh')->assertOk();
    expect(Lead::count())->toBe(1);
});

it('turns a new Messenger sender into a lead and keeps their later messages on it', function () {
    Notification::fake();
    $manager = Admin::factory()->leadManager()->create();
    metaSource(LeadSourceType::FacebookMessenger);
    Http::fake(['graph.facebook.com/PSID1*' => Http::response(['name' => 'Rina Akter', 'profile_pic' => 'https://scontent.fbcdn.net/p.jpg'])]);

    signedPost('/api/webhook/facebook', messengerPayload('PSID1', 'm1', 'Hi, price?'))->assertOk();
    signedPost('/api/webhook/facebook', messengerPayload('PSID1', 'm2', 'Still there?'))->assertOk();
    // Meta re-delivering the same message is ignored.
    signedPost('/api/webhook/facebook', messengerPayload('PSID1', 'm2', 'Still there?'))->assertOk();

    $lead = Lead::sole();

    expect($lead->name)->toBe('Rina Akter')
        ->and($lead->message)->toBe("Hi, price?\nStill there?")
        ->and($lead->source_data['facebook_profile_pic'])->toBe('https://scontent.fbcdn.net/p.jpg')
        ->and(LeadMessage::where('lead_id', $lead->id)->count())->toBe(2)
        ->and($lead->source->fresh()->last_synced_at)->not->toBeNull();

    Notification::assertSentToTimes($manager, NewLeadNotification::class, 1);
});

it('queues downloads for pictures people send', function () {
    metaSource(LeadSourceType::FacebookMessenger);
    Http::fake(['graph.facebook.com/*' => Http::response([], 500)]);

    signedPost('/api/webhook/facebook', messengerPayload('PSID2', 'm9', null, [
        'attachments' => [['type' => 'image', 'payload' => ['url' => 'https://scontent.fbcdn.net/x.jpg']]],
    ]))->assertOk();

    $lead = Lead::sole();

    expect($lead->name)->toBe('Facebook User PSID2')
        ->and(LeadAttachment::where('lead_id', $lead->id)->value('status')->value)->toBe('downloading');
    Queue::assertPushed(DownloadLeadAttachment::class);
});

it('creates Instagram leads the same way', function () {
    metaSource(LeadSourceType::Instagram);
    Http::fake(['graph.facebook.com/IGSID*' => Http::response(['username' => 'shop.lover'])]);

    signedPost('/api/webhook/instagram', ['object' => 'instagram', 'entry' => [['id' => 'IG1', 'messaging' => [[
        'sender' => ['id' => 'IGSID'], 'timestamp' => now()->getTimestampMs(), 'message' => ['mid' => 'ig1', 'text' => 'Do you ship?'],
    ]]]]])->assertOk();

    expect(Lead::sole())
        ->name->toBe('shop.lover')
        ->message->toBe('Do you ship?');
});

it('routes WhatsApp messages to the number they were sent to, and joins a sender\'s messages', function () {
    metaSource(LeadSourceType::Whatsapp, [], 'Main number');
    $second = metaSource(LeadSourceType::Whatsapp, ['phone_number_id' => 'PHONE2'], 'Support number');

    $payload = fn (string $id, string $text) => ['object' => 'whatsapp_business_account', 'entry' => [['changes' => [['value' => [
        'metadata' => ['phone_number_id' => 'PHONE2'],
        'contacts' => [['wa_id' => '8801711000000', 'profile' => ['name' => 'Kamal']]],
        'messages' => [['from' => '8801711000000', 'id' => $id, 'timestamp' => (string) now()->timestamp, 'type' => 'text', 'text' => ['body' => $text]]],
    ]]]]]];

    signedPost('/api/webhook/whatsapp', $payload('wamid.1', 'Hello'))->assertOk();
    signedPost('/api/webhook/whatsapp', $payload('wamid.2', 'Need a quote'))->assertOk();

    expect(Lead::sole())
        ->source_id->toBe($second->id)
        ->name->toBe('Kamal')
        ->phone->toBe('8801711000000')
        ->message->toBe("Hello\nNeed a quote");
});

it('ignores a delivery carrying too many messages', function () {
    config(['leads.max_inbound_messages_per_request' => 1]);
    metaSource(LeadSourceType::FacebookMessenger);
    $payload = messengerPayload('PSID1', 'm1');
    $payload['entry'][0]['messaging'][] = $payload['entry'][0]['messaging'][0];

    signedPost('/api/webhook/facebook', $payload)->assertOk();

    expect(Lead::count())->toBe(0);
});
