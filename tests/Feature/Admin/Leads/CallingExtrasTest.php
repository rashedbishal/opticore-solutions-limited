<?php

require_once __DIR__.'/ChannelHelpers.php';

use App\Leads\Calling\CallPush;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Jobs\SendCallPush;
use App\Leads\Models\LeadCall;
use App\Leads\Models\LeadSetting;
use App\Leads\Notifications\IncomingCallPushNotification;
use App\Models\Admin;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use NotificationChannels\WebPush\PushSubscription;

function ringingCall(): LeadCall
{
    $source = metaSource(LeadSourceType::Whatsapp, ['app_secret' => 'shh']);
    $source->update(['calling_enabled' => true]);

    signedPost('/api/webhook/whatsapp', ['entry' => [['changes' => [['value' => [
        'metadata' => ['phone_number_id' => 'PHONE1'],
        'calls' => [['id' => 'wacid.P', 'event' => 'connect', 'from' => '8801711000000', 'timestamp' => (string) now()->getTimestamp(),
            'session' => ['sdp_type' => 'offer', 'sdp' => "v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n"]]],
    ]]]]]], 'shh');

    return LeadCall::sole();
}

it('lets only the mother admin create push keys, and new keys drop old devices', function () {
    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->post(route('admin.lead-settings.general.push-keys'))->assertForbidden();

    $mother = Admin::factory()->create();
    $this->flushSession();
    $this->actingAs($mother, 'admin')->post(route('admin.lead-settings.general.push-keys'))->assertSessionHas('success');

    $settings = LeadSetting::current();
    expect($settings->vapid_public_key)->not->toBeNull()
        ->and($settings->getRawOriginal('vapid_private_key'))->not->toBe($settings->vapid_private_key);

    $mother->updatePushSubscription('https://push.example/abc', 'key', 'auth');
    $this->actingAs($mother, 'admin')->post(route('admin.lead-settings.general.push-keys'));

    expect(PushSubscription::count())->toBe(0);
});

it('registers this device for call alerts', function () {
    $agent = Admin::factory()->leadAgent()->create();

    $this->actingAs($agent, 'admin')->postJson(route('admin.leads.push.subscribe'), [
        'endpoint' => 'https://fcm.googleapis.com/fcm/send/xyz',
        'keys' => ['p256dh' => 'BPk', 'auth' => 'au'],
    ])->assertOk();

    expect($agent->pushSubscriptions()->count())->toBe(1);

    $this->actingAs($agent, 'admin')->deleteJson(route('admin.leads.push.unsubscribe'), ['endpoint' => 'https://fcm.googleapis.com/fcm/send/xyz'])->assertOk();
    expect($agent->pushSubscriptions()->count())->toBe(0);
});

it('pushes a ring to subscribed people it rings, then a stop when it ends', function () {
    app(CallPush::class)->generate();
    $manager = Admin::factory()->leadManager()->create();
    $manager->updatePushSubscription('https://push.example/m', 'key', 'auth');
    Admin::factory()->leadManager()->create();
    Notification::fake();

    $call = ringingCall();

    Notification::assertSentTo($manager, IncomingCallPushNotification::class, fn ($n) => $n->callId === $call->id && ! $n->ended);
    Notification::assertSentTimes(IncomingCallPushNotification::class, 1);

    (new SendCallPush($call->id, ended: true))->handle(app(CallPush::class));
    Notification::assertSentTo($manager, IncomingCallPushNotification::class, fn ($n) => $n->ended);
});

it('sends no push before keys exist', function () {
    $manager = Admin::factory()->leadManager()->create();
    $manager->updatePushSubscription('https://push.example/m', 'key', 'auth');
    Notification::fake();

    ringingCall();

    Notification::assertNotSentTo($manager, IncomingCallPushNotification::class);
});

it('lets managers upload a ringtone that every call box then plays', function () {
    Storage::fake('local');
    $manager = Admin::factory()->leadManager()->create();
    $agent = Admin::factory()->leadAgent()->create();

    $this->actingAs($agent, 'admin')->post(route('admin.leads.calling.ringtone.upload'), ['ringtone' => UploadedFile::fake()->create('ring.mp3', 100, 'audio/mpeg')])->assertForbidden();

    $this->flushSession();
    $this->actingAs($manager, 'admin')->post(route('admin.leads.calling.ringtone.upload'), ['ringtone' => UploadedFile::fake()->create('ring.mp3', 2000, 'audio/mpeg')])->assertSessionHasErrors('ringtone');
    $this->actingAs($manager, 'admin')->post(route('admin.leads.calling.ringtone.upload'), ['ringtone' => UploadedFile::fake()->create('ring.mp3', 100, 'audio/mpeg')])->assertSessionHas('success');

    $this->flushSession();
    $url = $this->actingAs($agent, 'admin')->getJson(route('admin.leads.calls.active'))->json('data.ringtone_url');
    expect($url)->not->toBeNull();
    $this->actingAs($agent, 'admin')->get($url)->assertOk();

    $this->flushSession();
    $this->actingAs($manager, 'admin')->delete(route('admin.leads.calling.ringtone.remove'));
    expect(LeadSetting::current()->ringtone_path)->toBeNull();
});

it('serves the iPhone manifest link on admin pages only', function () {
    $this->actingAs(Admin::factory()->create(), 'admin')->get('/admin')->assertSee('admin.webmanifest', false);
    $this->get('/')->assertDontSee('admin.webmanifest', false);
});
