<?php

require_once __DIR__.'/ChannelHelpers.php';

use App\Leads\Calling\LeadCallSdp;
use App\Leads\Enums\CallRoutingMode;
use App\Leads\Enums\CallStatus;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadCall;
use App\Leads\Models\LeadSource;
use App\Leads\Notifications\MissedCallNotification;
use App\Models\Admin;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

const OFFER = "v=0\r\no=- 1 1 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n";
const ANSWER = "v=0\r\no=- 2 2 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n";

function callingSource(bool $enabled = true): LeadSource
{
    $source = metaSource(LeadSourceType::Whatsapp, ['app_secret' => 'shh']);
    $source->update(['calling_enabled' => $enabled]);

    return $source;
}

function callEvent(string $event, string $id = 'wacid.1', string $from = '8801711000000', array $extra = []): array
{
    $call = ['id' => $id, 'event' => $event, 'from' => $from, 'to' => '8809600000000', 'timestamp' => (string) now()->getTimestamp(), ...$extra];

    if ($event === 'connect') {
        $call['session'] = ['sdp_type' => 'offer', 'sdp' => OFFER];
    }

    return ['entry' => [['changes' => [['value' => [
        'metadata' => ['phone_number_id' => 'PHONE1', 'display_phone_number' => '+880 9600-000000'],
        'contacts' => [['wa_id' => $from, 'profile' => ['name' => 'Karim Caller']]],
        'calls' => [$call],
    ]]]]]];
}

it('rings the managers for a new caller and creates the lead', function () {
    callingSource();
    $manager = Admin::factory()->leadManager()->create();

    signedPost('/api/webhook/whatsapp', callEvent('connect'), 'shh')->assertOk();

    $call = LeadCall::sole();
    expect($call->status)->toBe(CallStatus::Ringing)
        ->and($call->routing_mode)->toBe(CallRoutingMode::ManagerFallback)
        ->and($call->isRoutedTo((int) $manager->id))->toBeTrue()
        ->and(Lead::sole()->name)->toBe('Karim Caller')
        ->and(LeadCallSdp::readOffer($call->lead_source_id, 'wacid.1'))->toBe(OFFER);

    // Meta retries are harmless.
    signedPost('/api/webhook/whatsapp', callEvent('connect'), 'shh')->assertOk();
    expect(LeadCall::count())->toBe(1);
});

it('ignores calls while calling is off', function () {
    callingSource(enabled: false);

    signedPost('/api/webhook/whatsapp', callEvent('connect'), 'shh')->assertOk();

    expect(LeadCall::count())->toBe(0)->and(Lead::count())->toBe(0);
});

it('rings the lead\'s person when online, else the backup receivers', function () {
    $source = callingSource();
    $agent = Admin::factory()->leadAgent()->create();
    $backup = Admin::factory()->leadAgent()->create();
    $backup->forceFill(['is_whatsapp_backup_receiver' => true])->save();
    $lead = Lead::factory()->fromSource($source)->assignedTo($agent)->create(['phone' => '8801711000000']);

    signedPost('/api/webhook/whatsapp', callEvent('connect', 'wacid.away'), 'shh');
    expect(LeadCall::sole()->routed_user_ids)->toBe([(int) $backup->id]);

    $agent->forceFill(['softphone_last_seen_at' => now()])->save();
    signedPost('/api/webhook/whatsapp', callEvent('connect', 'wacid.online'), 'shh');

    $call = LeadCall::query()->where('external_call_id', 'wacid.online')->sole();
    expect($call->routing_mode)->toBe(CallRoutingMode::Assignee)
        ->and($call->routed_user_ids)->toBe([(int) $agent->id])
        ->and($call->lead_id)->toBe($lead->id);
});

it('answers a call end to end, and only one person wins it', function () {
    callingSource();
    $first = Admin::factory()->leadManager()->create();
    $second = Admin::factory()->leadManager()->create();
    signedPost('/api/webhook/whatsapp', callEvent('connect'), 'shh');
    $call = LeadCall::sole();
    Http::fake(['graph.facebook.com/*/PHONE1/calls' => Http::response(['success' => true])]);

    $this->actingAs($first, 'admin')->postJson(route('admin.leads.calls.claim', $call->id))
        ->assertOk()->assertJsonPath('data.session.sdp', OFFER);
    $this->actingAs($second, 'admin')->postJson(route('admin.leads.calls.claim', $call->id))
        ->assertStatus(409)->assertJsonPath('error.code', 'already_claimed');

    $this->actingAs($first, 'admin')->postJson(route('admin.leads.calls.answer', $call->id), ['sdp_type' => 'answer', 'sdp' => ANSWER])->assertOk();
    $this->actingAs($first, 'admin')->postJson(route('admin.leads.calls.accept', $call->id))
        ->assertOk()->assertJsonPath('data.call.status', 'connected');

    Http::assertSent(fn ($r) => $r['action'] === 'pre_accept' && $r['session']['sdp'] === ANSWER);
    Http::assertSent(fn ($r) => $r['action'] === 'accept');

    $this->actingAs($first, 'admin')->postJson(route('admin.leads.calls.hangup', $call->id))->assertOk();
    expect($call->fresh()->status)->toBe(CallStatus::Completed)
        ->and($call->fresh()->claimed_by_name)->toBe($first->name);
    Http::assertSent(fn ($r) => $r['action'] === 'terminate');
});

it('refuses people the call did not ring for', function () {
    callingSource();
    Admin::factory()->leadManager()->create();
    signedPost('/api/webhook/whatsapp', callEvent('connect'), 'shh');

    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')
        ->postJson(route('admin.leads.calls.claim', LeadCall::sole()->id))
        ->assertForbidden();
});

it('declining ends the call for everyone', function () {
    callingSource();
    $manager = Admin::factory()->leadManager()->create();
    signedPost('/api/webhook/whatsapp', callEvent('connect'), 'shh');
    Http::fake(['graph.facebook.com/*' => Http::response(['success' => true])]);

    $this->actingAs($manager, 'admin')->postJson(route('admin.leads.calls.reject', LeadCall::sole()->id))->assertOk();

    expect(LeadCall::sole()->status)->toBe(CallStatus::Rejected);
    Http::assertSent(fn ($r) => $r['action'] === 'reject');
});

it('marks a call missed when the caller hangs up, and alerts the managers', function () {
    callingSource();
    $manager = Admin::factory()->leadManager()->create();
    signedPost('/api/webhook/whatsapp', callEvent('connect'), 'shh');

    signedPost('/api/webhook/whatsapp', callEvent('terminate', extra: ['status' => 'Failed']), 'shh')->assertOk();

    expect(LeadCall::sole()->status)->toBe(CallStatus::Missed)
        ->and($manager->notifications()->where('type', MissedCallNotification::class)->count())->toBe(1);
});

it('a terminate that beats its connect stops the late connect ringing', function () {
    callingSource();
    Admin::factory()->leadManager()->create();

    signedPost('/api/webhook/whatsapp', callEvent('terminate'), 'shh');
    signedPost('/api/webhook/whatsapp', callEvent('connect'), 'shh');

    expect(LeadCall::count())->toBe(0)->and(Lead::count())->toBe(0);
});

it('ends calls Meta never closed', function () {
    callingSource();
    Admin::factory()->leadManager()->create();
    signedPost('/api/webhook/whatsapp', callEvent('connect'), 'shh');

    Carbon::setTestNow(now()->addMinutes(5));
    $this->artisan('calls:reconcile-stale')->assertSuccessful();

    expect(LeadCall::sole()->status)->toBe(CallStatus::Missed);
});

it('lists ringing calls for the call box and records the check-in', function () {
    callingSource();
    $manager = Admin::factory()->leadManager()->create();
    signedPost('/api/webhook/whatsapp', callEvent('connect'), 'shh');

    $this->actingAs($manager, 'admin')->getJson(route('admin.leads.calls.active'))
        ->assertOk()
        ->assertJsonPath('data.calls.0.lead.name', 'Karim Caller')
        ->assertJsonPath('data.calls.0.status', 'ringing');

    expect($manager->fresh()->softphone_last_seen_at)->not->toBeNull();
});

it('won\'t delete a lead that is on a call', function () {
    callingSource();
    $manager = Admin::factory()->leadManager()->create();
    signedPost('/api/webhook/whatsapp', callEvent('connect'), 'shh');

    $this->actingAs($manager, 'admin')->delete(route('admin.leads.destroy', Lead::sole()))->assertSessionHas('error');
    expect(Lead::count())->toBe(1);
});

it('lets the mother admin turn calling on with Meta, and managers tick backups', function () {
    $source = metaSource(LeadSourceType::Whatsapp, ['app_secret' => 'shh']);
    Http::fake([
        'graph.facebook.com/*/PHONE1/settings' => Http::sequence()
            ->push(['success' => true])
            ->push(['calling' => ['status' => 'ENABLED']]),
    ]);

    $this->actingAs(Admin::factory()->create(), 'admin')
        ->post(route('admin.lead-settings.sources.calling.enable', $source))
        ->assertSessionHas('success', 'Calling is now on for this WhatsApp number.');
    expect($source->fresh()->calling_enabled)->toBeTrue();

    $this->flushSession();
    $agent = Admin::factory()->leadAgent()->create();
    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->post(route('admin.leads.calling.backups.toggle', $agent->id))->assertSessionHas('success');
    expect($agent->fresh()->is_whatsapp_backup_receiver)->toBeTrue();
});
