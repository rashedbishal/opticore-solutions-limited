<?php

require_once __DIR__.'/ChannelHelpers.php';

use App\Leads\Actions\RecordLeadConsent;
use App\Leads\Enums\ConsentSource;
use App\Leads\Enums\ConsentStatus;
use App\Leads\Enums\ConsentType;
use App\Leads\Enums\LeadAttachmentStatus;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Enums\MessageChannel;
use App\Leads\Enums\MessageDirection;
use App\Leads\Enums\MessageStatus;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadConsentEvent;
use App\Leads\Models\LeadConversation;
use App\Leads\Models\LeadConversationDeletion;
use App\Leads\Models\LeadMessage;
use App\Leads\Models\MessengerMessageTemplate;
use App\Leads\Models\WhatsAppMessageTemplate;
use App\Models\Admin;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A lead on a channel, with a conversation whose last inbound message was
 * $hoursAgo hours ago.
 *
 * @return array{0: Lead, 1: LeadConversation, 2: Admin}
 */
function chatLead(LeadSourceType $type = LeadSourceType::Whatsapp, int $hoursAgo = 1): array
{
    $source = metaSource($type);
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->fromSource($source)->assignedTo($agent)->create();
    $channel = MessageChannel::fromSourceType($type);
    $conversation = LeadConversation::create([
        'lead_id' => $lead->id, 'lead_source_id' => $source->id, 'channel' => $channel,
        'external_thread_id' => $type === LeadSourceType::Whatsapp ? '8801711000000' : 'PSID1',
        'last_inbound_at' => now()->subHours($hoursAgo),
    ]);

    return [$lead, $conversation, $agent];
}

beforeEach(fn () => Storage::fake('local'));

it('sends a WhatsApp reply inside the 24-hour window and marks it sent', function () {
    [$lead, , $agent] = chatLead();
    Http::fake(['graph.facebook.com/v20.0/PHONE1/messages' => Http::response(['messages' => [['id' => 'wamid.OUT1']]])]);

    $this->actingAs($agent, 'admin')
        ->post(route('admin.leads.messages.send', $lead), ['body' => 'Thanks, here is the price.'])
        ->assertSessionHas('success');

    $message = LeadMessage::sole();

    expect($message->status)->toBe(MessageStatus::Sent)
        ->and($message->external_message_id)->toBe('wamid.OUT1')
        ->and($message->sent_by_name)->toBe($agent->name)
        ->and($lead->fresh()->first_contacted_at)->not->toBeNull();

    Http::assertSent(fn ($request) => $request['to'] === '8801711000000' && $request['text']['body'] === 'Thanks, here is the price.');
});

it('refuses a free-form reply after the window closes, and when privacy consent is withdrawn', function () {
    [$lead, , $agent] = chatLead(hoursAgo: 30);
    Http::fake();

    $this->actingAs($agent, 'admin')
        ->post(route('admin.leads.messages.send', $lead), ['body' => 'Hello?'])
        ->assertSessionHas('error');

    [$lead2, , $agent2] = chatLead(LeadSourceType::FacebookMessenger);
    app(RecordLeadConsent::class)->handle($lead2, ConsentType::Privacy, ConsentStatus::Withdrawn, ConsentSource::Manual);

    $this->flushSession();
    $this->actingAs($agent2, 'admin')
        ->post(route('admin.leads.messages.send', $lead2), ['body' => 'Hello?'])
        ->assertSessionHas('error', 'Privacy consent has been withdrawn for this lead — messaging is blocked.');

    expect(LeadMessage::count())->toBe(0);
    Http::assertNothingSent();
});

it('stops an agent replying on someone else\'s lead', function () {
    [$lead] = chatLead();

    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')
        ->post(route('admin.leads.messages.send', $lead), ['body' => 'Hi'])
        ->assertForbidden();
});

it('sends a picture with a caption on WhatsApp, but as two messages on Messenger', function () {
    Http::fake([
        'graph.facebook.com/v20.0/PHONE1/media' => Http::response(['id' => 'MEDIA1']),
        'graph.facebook.com/v20.0/PHONE1/messages' => Http::response(['messages' => [['id' => 'wamid.X']]]),
        'graph.facebook.com/v20.0/me/message_attachments' => Http::response(['attachment_id' => 'ATT1']),
        'graph.facebook.com/v20.0/me/messages' => Http::response(['message_id' => 'mid.X']),
    ]);

    [$waLead, , $waAgent] = chatLead();
    $this->actingAs($waAgent, 'admin')
        ->post(route('admin.leads.messages.send', $waLead), ['body' => 'Our brochure', 'file' => UploadedFile::fake()->image('photo.png')])
        ->assertSessionHas('success');

    expect(LeadMessage::where('lead_id', $waLead->id)->count())->toBe(1)
        ->and(LeadMessage::where('lead_id', $waLead->id)->sole()->body)->toBe('Our brochure');

    $this->flushSession();
    [$fbLead, , $fbAgent] = chatLead(LeadSourceType::FacebookMessenger);
    $this->actingAs($fbAgent, 'admin')
        ->post(route('admin.leads.messages.send', $fbLead), ['body' => 'Our brochure', 'file' => UploadedFile::fake()->image('photo.png')])
        ->assertSessionHas('success');

    expect(LeadMessage::where('lead_id', $fbLead->id)->pluck('message_type')->map->value->sort()->values()->all())->toBe(['image', 'text']);
});

it('rejects a file type the channel can\'t send', function () {
    [$lead, , $agent] = chatLead(LeadSourceType::Instagram);

    $this->actingAs($agent, 'admin')
        ->post(route('admin.leads.messages.send', $lead), ['file' => UploadedFile::fake()->create('anim.gif', 10, 'image/gif')])
        ->assertSessionHasErrors('file');
});

it('sends a WhatsApp template after the window has closed', function () {
    [$lead, $conversation, $agent] = chatLead(hoursAgo: 48);
    $template = WhatsAppMessageTemplate::create(['lead_source_id' => $conversation->lead_source_id, 'name' => 'order_update', 'language' => 'en_US', 'variable_count' => 2]);
    Http::fake(['graph.facebook.com/v20.0/PHONE1/messages' => Http::response(['messages' => [['id' => 'wamid.T']]])]);

    $this->actingAs($agent, 'admin')
        ->post(route('admin.leads.messages.template', $lead), ['template_id' => $template->id, 'variables' => ['Rahim', 'website']])
        ->assertSessionHas('success');

    expect(LeadMessage::sole()->status)->toBe(MessageStatus::Sent);
    Http::assertSent(fn ($request) => $request['type'] === 'template'
        && $request['template']['name'] === 'order_update'
        && $request['template']['components'][0]['parameters'][1]['text'] === 'website');
});

it('requires every template blank and sends Messenger templates as Utility messages', function () {
    [$lead, $conversation, $agent] = chatLead(LeadSourceType::FacebookMessenger, hoursAgo: 48);
    $template = MessengerMessageTemplate::create(['lead_source_id' => $conversation->lead_source_id, 'name' => 'inquiry_update', 'language' => 'en_US', 'body_text' => 'Hi {{1}}', 'variable_count' => 1]);
    Http::fake(['graph.facebook.com/v26.0/PAGE1/messages' => Http::response(['message_id' => 'mid.T'])]);

    $this->actingAs($agent, 'admin')
        ->post(route('admin.leads.messages.template', $lead), ['template_id' => $template->id, 'variables' => ['']])
        ->assertSessionHasErrors('variables.0');

    $this->actingAs($agent, 'admin')
        ->post(route('admin.leads.messages.template', $lead), ['template_id' => $template->id, 'variables' => ['Rina']])
        ->assertSessionHas('success');

    Http::assertSent(fn ($request) => $request['messaging_type'] === 'UTILITY');
});

it('shows why a message failed and resends it once', function () {
    [$lead, , $agent] = chatLead();
    Http::fakeSequence('graph.facebook.com/*')
        ->push(['error' => ['message' => 'Recipient phone number not in allowed list']], 400)
        ->push(['messages' => [['id' => 'wamid.OK']]]);

    $this->actingAs($agent, 'admin')->post(route('admin.leads.messages.send', $lead), ['body' => 'Hi']);
    $failed = LeadMessage::sole();

    expect($failed->status)->toBe(MessageStatus::Failed)
        ->and($failed->failure_reason)->toBe('Recipient phone number not in allowed list');

    $this->actingAs($agent, 'admin')->post(route('admin.leads.messages.resend', [$lead, $failed]))->assertSessionHas('success');
    $this->actingAs($agent, 'admin')->post(route('admin.leads.messages.resend', [$lead, $failed]))->assertSessionHas('error', 'This message has already been resent.');

    expect(LeadMessage::count())->toBe(2)
        ->and(LeadMessage::where('status', 'sent')->count())->toBe(1);
});

it('moves delivery ticks forward only, from WhatsApp and Messenger receipts', function () {
    [$lead, $conversation] = chatLead();
    $message = LeadMessage::create(['conversation_id' => $conversation->id, 'lead_id' => $lead->id, 'channel' => 'whatsapp', 'direction' => MessageDirection::Outbound, 'message_type' => 'text', 'body' => 'x', 'status' => MessageStatus::Sent, 'external_message_id' => 'wamid.S']);
    $status = fn (string $value) => ['entry' => [['changes' => [['value' => ['metadata' => ['phone_number_id' => 'PHONE1'], 'statuses' => [['id' => 'wamid.S', 'status' => $value]]]]]]]];

    signedPost('/api/webhook/whatsapp', $status('read'))->assertOk();
    signedPost('/api/webhook/whatsapp', $status('delivered'))->assertOk();

    expect($message->fresh()->status)->toBe(MessageStatus::Read);

    [$fbLead, $fbConversation] = chatLead(LeadSourceType::FacebookMessenger);
    $fbMessage = LeadMessage::create(['conversation_id' => $fbConversation->id, 'lead_id' => $fbLead->id, 'channel' => 'messenger', 'direction' => MessageDirection::Outbound, 'message_type' => 'text', 'body' => 'x', 'status' => MessageStatus::Sent]);

    signedPost('/api/webhook/facebook', ['entry' => [['id' => 'PAGE1', 'messaging' => [['sender' => ['id' => 'PSID1'], 'recipient' => ['id' => 'PAGE1'], 'read' => ['watermark' => now()->addMinute()->getTimestampMs()]]]]]])->assertOk();

    expect($fbMessage->fresh()->status)->toBe(MessageStatus::Read);
});

it('lets only managers hide a sent message or delete the whole conversation', function () {
    [$lead, $conversation, $agent] = chatLead();
    Storage::disk('local')->put('leads/outbound/whatsapp/a.png', 'x');
    $message = LeadMessage::create(['conversation_id' => $conversation->id, 'lead_id' => $lead->id, 'channel' => 'whatsapp', 'direction' => MessageDirection::Outbound, 'message_type' => 'image', 'attachment_path' => 'leads/outbound/whatsapp/a.png', 'status' => MessageStatus::Sent]);
    $manager = Admin::factory()->leadManager()->create();

    $this->actingAs($agent, 'admin')->post(route('admin.leads.messages.hide', [$lead, $message]))->assertForbidden();
    $this->flushSession();
    $this->actingAs($manager, 'admin')->post(route('admin.leads.messages.hide', [$lead, $message]))->assertSessionHas('success');
    expect($message->fresh()->activity_log_hidden_at)->not->toBeNull();

    $this->actingAs($manager, 'admin')->delete(route('admin.leads.conversation.destroy', $lead))->assertSessionHas('success');

    expect(LeadMessage::count())->toBe(0)
        ->and(LeadConversation::count())->toBe(0)
        ->and(LeadConversationDeletion::sole()->summary['messages'])->toBe(1)
        ->and(Lead::find($lead->id))->not->toBeNull();
    Storage::disk('local')->assertMissing('leads/outbound/whatsapp/a.png');
});

it('records consent changes with history, kept even after the lead is deleted', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->assignedTo($agent)->create();

    $this->actingAs($agent, 'admin')->post(route('admin.leads.consents.update', [$lead, 'marketing', 'granted']))->assertSessionHas('success');
    $this->actingAs($agent, 'admin')->post(route('admin.leads.consents.update', [$lead, 'marketing', 'withdrawn']));

    expect($lead->consents()->sole()->status)->toBe(ConsentStatus::Withdrawn)
        ->and($lead->consentEvents()->count())->toBe(2)
        ->and($lead->consentEvents()->first()->changed_by_name)->toBe($agent->name);

    $this->flushSession();
    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')->delete(route('admin.leads.destroy', $lead));

    expect(LeadConsentEvent::query()->whereNull('lead_id')->where('lead_identifier', $lead->identifier)->count())->toBe(2);
});

it('lets only managers manage templates, and creates Messenger ones with Meta', function () {
    $source = metaSource(LeadSourceType::FacebookMessenger);
    $wa = metaSource(LeadSourceType::Whatsapp);
    $manager = Admin::factory()->leadManager()->create();

    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')->get(route('admin.leads.templates.index'))->assertForbidden();
    $this->flushSession();

    $this->actingAs($manager, 'admin')->post(route('admin.leads.templates.whatsapp.store'), ['source_id' => $wa->id, 'name' => 'Bad Name', 'language' => 'en_US', 'variable_count' => 0])->assertSessionHasErrors('name');
    $this->actingAs($manager, 'admin')->post(route('admin.leads.templates.whatsapp.store'), ['source_id' => $wa->id, 'name' => 'order_update', 'language' => 'en_US', 'variable_count' => 1])->assertSessionHasNoErrors();
    $this->actingAs($manager, 'admin')->post(route('admin.leads.templates.whatsapp.store'), ['source_id' => $wa->id, 'name' => 'order_update', 'language' => 'en_US', 'variable_count' => 1])->assertSessionHasErrors('name');

    Http::fake([
        'graph.facebook.com/v26.0/PAGE1/message_templates*' => Http::response(['id' => 'T1', 'status' => 'APPROVED']),
    ]);

    $this->actingAs($manager, 'admin')
        ->post(route('admin.leads.templates.messenger.store'), ['source_id' => $source->id, 'name' => 'inquiry_update', 'language' => 'en_US', 'body_text' => 'Hi {{1}}, about {{2}}'])
        ->assertSessionHas('success');

    expect(MessengerMessageTemplate::sole()->variable_count)->toBe(2);

    $this->actingAs($manager, 'admin')
        ->post(route('admin.leads.templates.messenger.store'), ['source_id' => $source->id, 'name' => 'another', 'language' => 'en_US', 'body_text' => 'Hi'])
        ->assertSessionHas('error', 'This Page already has a template. Delete it first to create a replacement.');

    $this->actingAs($manager, 'admin')->delete(route('admin.leads.templates.messenger.destroy', MessengerMessageTemplate::sole()))->assertSessionHas('success');
    expect(MessengerMessageTemplate::count())->toBe(0);
});

it('removes a Messenger template Meta rejects and shows why', function () {
    $source = metaSource(LeadSourceType::FacebookMessenger);
    Http::fake([
        'graph.facebook.com/v26.0/PAGE1/message_templates*' => Http::response(['id' => 'T9', 'status' => 'REJECTED']),
        'graph.facebook.com/v26.0/T9*' => Http::response(['rejected_reason' => 'PROMOTIONAL']),
    ]);

    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->post(route('admin.leads.templates.messenger.store'), ['source_id' => $source->id, 'name' => 'sale_now', 'language' => 'en_US', 'body_text' => 'Big sale!'])
        ->assertSessionHas('error');

    expect(MessengerMessageTemplate::count())->toBe(0);
    Http::assertSent(fn ($request) => $request->method() === 'DELETE');
});

it('shows a customer picture once, without an extra "(no text)" message', function () {
    [$lead, $conversation, $agent] = chatLead();
    LeadMessage::create(['conversation_id' => $conversation->id, 'lead_id' => $lead->id, 'channel' => 'whatsapp', 'direction' => MessageDirection::Inbound, 'message_type' => 'text', 'body' => null, 'external_message_id' => 'wamid.IMG']);
    LeadMessage::create(['conversation_id' => $conversation->id, 'lead_id' => $lead->id, 'channel' => 'whatsapp', 'direction' => MessageDirection::Inbound, 'message_type' => 'text', 'body' => 'Hello', 'external_message_id' => 'wamid.TXT']);
    $lead->attachments()->create(['type' => 'image', 'status' => LeadAttachmentStatus::Downloading, 'sent_at' => now()]);

    $this->actingAs($agent, 'admin')->get(route('admin.leads.show', $lead))
        ->assertInertia(fn (Assert $page) => $page
            ->where('lead.conversation', fn ($items) => collect($items)->pluck('kind')->sort()->values()->all() === ['attachment', 'message']
                && collect($items)->firstWhere('kind', 'message')['body'] === 'Hello'));
});
