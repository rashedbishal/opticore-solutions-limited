<?php

require_once __DIR__.'/ChannelHelpers.php';

use App\Leads\CallingApp\CallingAppCallPush;
use App\Leads\CallingApp\CallingAppDevice;
use App\Leads\CallingApp\CallingAppFirebase;
use App\Leads\CallingApp\CallingAppRelease;
use App\Leads\CallingApp\CallingAppToken as PersonalAccessToken;
use App\Leads\Enums\CallRoutingMode;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadCall;
use App\Models\Admin;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

function firebaseKey(string $project = 'optifin-calling'): array
{
    return ['type' => 'service_account', 'project_id' => $project, 'client_email' => 'x@'.$project.'.iam.gserviceaccount.com', 'private_key' => "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n"];
}

/**
 * @return array{0: Admin, 1: string}
 */
function pairedAgent(): array
{
    $agent = Admin::factory()->leadAgent()->create();
    $code = test()->actingAs($agent, 'admin')->postJson(route('admin.leads.calling-app.connect'))->json('data.code');
    test()->flushSession();
    app('auth')->forgetGuards();

    $token = test()->postJson('/api/calling-app/pair', ['code' => $code, 'device_name' => 'Pixel 8'])->assertOk()->json('data.token');

    return [$agent, $token];
}

it('pairs a phone with a one-time code and answers as that admin', function () {
    [$agent, $token] = pairedAgent();

    $this->withToken($token)->getJson('/api/calling-app/me')
        ->assertOk()
        ->assertJsonPath('data.user.id', (string) $agent->id)
        ->assertJsonPath('data.user.name', $agent->name);

    expect(CallingAppDevice::sole()->device_name)->toBe('Pixel 8');

    // The code works once.
    $this->postJson('/api/calling-app/pair', ['code' => 'nope'])->assertStatus(422)->assertJsonPath('error.code', 'invalid_pairing_code');
});

it('refuses ordinary tokens and disconnected phones', function () {
    [$agent, $token] = pairedAgent();
    $other = $agent->createToken('not the app', ['something-else'])->plainTextToken;

    $this->withToken($other)->getJson('/api/calling-app/me')->assertStatus(401)->assertJsonPath('error.code', 'unpaired');
    app('auth')->forgetGuards();

    $this->withToken($token)->postJson('/api/calling-app/unpair')->assertOk();
    app('auth')->forgetGuards();
    $this->withToken($token)->getJson('/api/calling-app/me')->assertStatus(401);

    expect(CallingAppDevice::count())->toBe(0)->and(PersonalAccessToken::count())->toBe(1);
});

it('lets the app read calls and act through the browser\'s own endpoints', function () {
    [$agent, $token] = pairedAgent();
    $this->withToken($token)->postJson('/api/calling-app/push-token', ['token' => 'fcm-abc'])->assertOk();

    $source = metaSource(LeadSourceType::Whatsapp, ['app_secret' => 'shh']);
    $source->update(['calling_enabled' => true]);
    app(CallingAppFirebase::class)->store(firebaseKey());
    Lead::factory()->fromSource($source)->assignedTo($agent)->create(['phone' => '8801711000000']);
    Notification::fake();

    signedPost('/api/webhook/whatsapp', ['entry' => [['changes' => [['value' => [
        'metadata' => ['phone_number_id' => 'PHONE1'],
        'calls' => [['id' => 'wacid.APP', 'event' => 'connect', 'from' => '8801711000000', 'timestamp' => (string) now()->getTimestamp(),
            'session' => ['sdp_type' => 'offer', 'sdp' => "v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n"]]],
    ]]]]]], 'shh');

    // A connected phone counts as available: the lead's own agent rings.
    $call = LeadCall::sole();
    expect($call->routing_mode)->toBe(CallRoutingMode::Assignee);
    Notification::assertSentTo(CallingAppDevice::sole(), CallingAppCallPush::class, fn ($n) => $n->type === 'incoming_call' && $n->data['call_id'] === $call->id);

    app('auth')->forgetGuards();
    $this->withToken($token)->getJson('/api/calling-app/calls/active')->assertOk()->assertJsonPath('data.calls.0.id', $call->id);
    $this->withToken($token)->postJson("/api/calling-app/calls/{$call->id}/claim")->assertOk()->assertJsonPath('data.session.sdp_type', 'offer');
});

it('only accepts a Firebase key from the app\'s own project', function () {
    expect(CallingAppFirebase::validationError(firebaseKey('someone-else')))->toContain('someone-else')
        ->and(CallingAppFirebase::validationError(['type' => 'user']))->not->toBeNull()
        ->and(CallingAppFirebase::validationError(firebaseKey()))->toBeNull();
});

it('keeps Calling app settings mother-only and the page for any lead role', function () {
    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->get(route('admin.lead-settings.calling-app.edit'))->assertForbidden();

    $this->flushSession();
    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')
        ->get(route('admin.leads.calling-app.index'))->assertOk();
});

it('lets managers disconnect someone\'s phone', function () {
    [$agent] = pairedAgent();

    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->delete(route('admin.leads.calling.phones.disconnect', $agent->id))
        ->assertSessionHas('success');

    expect(CallingAppDevice::count())->toBe(0);
});

it('rejects an APK that isn\'t the calling app', function () {
    $mother = Admin::factory()->create();
    $this->actingAs($mother, 'admin');
    $id = $this->postJson(route('admin.lead-settings.calling-app.apk.start'), ['size' => 5])->json('data.upload_id');

    $this->call('PUT', route('admin.lead-settings.calling-app.apk.chunk', [$id, 0]), [], [], [], ['CONTENT_TYPE' => 'application/octet-stream', 'HTTP_ACCEPT' => 'application/json'], 'hello')->assertOk();
    $this->postJson(route('admin.lead-settings.calling-app.apk.complete', $id))
        ->assertStatus(422)->assertJsonPath('error.message', 'This is not an Android app (.apk) file.');
});

it('clears unfinished APK uploads older than a day when a new one starts', function () {
    Storage::fake('local');
    $release = app(CallingAppRelease::class);
    $old = $release->startUpload(10, null);
    $recent = $release->startUpload(10, null);
    touch(Storage::disk('local')->path("calling-app/uploads/{$old}/meta.json"), now()->subDays(2)->getTimestamp());

    $release->startUpload(10, null);

    expect(Storage::disk('local')->exists("calling-app/uploads/{$old}"))->toBeFalse()
        ->and(Storage::disk('local')->exists("calling-app/uploads/{$recent}"))->toBeTrue();
});

it('publishes the Android asset links for the app', function () {
    config(['calling.calling_app.android_sha256_fingerprints' => ['AA:BB']]);

    $this->getJson('/.well-known/assetlinks.json')->assertOk()->assertJsonPath('0.target.package_name', 'com.optifin.calling');
});
