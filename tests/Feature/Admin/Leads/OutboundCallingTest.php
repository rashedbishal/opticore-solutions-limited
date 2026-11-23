<?php

require_once __DIR__.'/ChannelHelpers.php';

use App\Leads\Calling\LeadCallSdp;
use App\Leads\Enums\CallDirection;
use App\Leads\Enums\CallEndReason;
use App\Leads\Enums\CallStatus;
use App\Leads\Enums\LeadCallPermissionStatus;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadCall;
use App\Leads\Models\LeadCallPermission;
use App\Models\Admin;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

const OUT_OFFER = "v=0\r\no=- 3 3 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n";
const OUT_ANSWER = "v=0\r\no=- 4 4 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n";

/**
 * @return array{0: Lead, 1: Admin}
 */
function callableLead(): array
{
    $source = metaSource(LeadSourceType::Whatsapp, ['app_secret' => 'shh', 'whatsapp_business_account_id' => 'WABA1']);
    $source->update(['calling_enabled' => true]);
    $agent = Admin::factory()->leadAgent()->create();

    return [Lead::factory()->fromSource($source)->assignedTo($agent)->create(['phone' => '+880 1711-000000']), $agent];
}

function permissionResponse(string $status, bool $canCall, bool $canAsk = false): array
{
    return [
        'permission' => ['status' => $status],
        'actions' => [
            ['action_name' => 'start_call', 'can_perform_action' => $canCall],
            ['action_name' => 'send_call_permission_request', 'can_perform_action' => $canAsk],
        ],
    ];
}

it('shows call controls to the lead\'s person and managers only', function () {
    [$lead, $agent] = callableLead();

    $this->actingAs($agent, 'admin')->get(route('admin.leads.show', $lead))
        ->assertInertia(fn (Assert $page) => $page->where('lead.calling.can_call', true)->where('lead.calling.status', 'no_permission'));

    $this->flushSession();
    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')
        ->post(route('admin.leads.call-permission.request', $lead))
        ->assertForbidden();
});

it('asks permission only when Meta allows asking, and records the reply', function () {
    [$lead, $agent] = callableLead();
    Http::fake([
        'graph.facebook.com/*/PHONE1/call_permissions*' => Http::response(permissionResponse('no_permission', false, true)),
        'graph.facebook.com/*/PHONE1/messages' => Http::response(['messages' => [['id' => 'wamid.P']]]),
    ]);

    $this->actingAs($agent, 'admin')->post(route('admin.leads.call-permission.request', $lead))->assertSessionHas('success');

    expect(LeadCallPermission::sole()->status)->toBe(LeadCallPermissionStatus::Requested);
    Http::assertSent(fn ($r) => str_contains($r->url(), '/messages') && isset($r['template'])
        && $r['to'] === '8801711000000'
        && $r['template']['name'] === 'call_permission_request_v2'
        && $r['template']['components'][0]['type'] === 'call_permission_request');

    signedPost('/api/webhook/whatsapp', ['entry' => [['changes' => [['value' => [
        'metadata' => ['phone_number_id' => 'PHONE1'],
        'messages' => [['from' => '8801711000000', 'timestamp' => (string) (now()->getTimestamp() + 5), 'type' => 'interactive', 'interactive' => [
            'type' => 'call_permission_reply',
            'call_permission_reply' => ['response' => 'accept', 'is_permanent' => true],
        ]]],
    ]]]]]], 'shh')->assertOk();

    expect(LeadCallPermission::sole()->status)->toBe(LeadCallPermissionStatus::Permanent)
        ->and($lead->conversations()->count())->toBe(0);
});

it('refuses to dial without permission', function () {
    [$lead, $agent] = callableLead();
    Http::fake(['graph.facebook.com/*/call_permissions*' => Http::response(permissionResponse('no_permission', false))]);

    $this->actingAs($agent, 'admin')->postJson(route('admin.leads.call', $lead), ['sdp' => OUT_OFFER])
        ->assertStatus(409)->assertJsonPath('error.code', 'permission_required');

    expect(LeadCall::count())->toBe(0);
});

it('calls a lead end to end: dial, they pick up, audio connects, hang up', function () {
    [$lead, $agent] = callableLead();
    Http::fake([
        'graph.facebook.com/*/call_permissions*' => Http::response(permissionResponse('permanent', true)),
        'graph.facebook.com/v26.0/PHONE1/calls' => Http::response(['calls' => [['id' => 'wacid.OUT']]]),
        'graph.facebook.com/v25.0/PHONE1/calls' => Http::response(['success' => true]),
    ]);

    $this->actingAs($agent, 'admin')->postJson(route('admin.leads.call', $lead), ['sdp' => OUT_OFFER])
        ->assertOk()->assertJsonPath('data.call.status', 'ringing');

    $call = LeadCall::sole();
    expect($call->direction)->toBe(CallDirection::Outbound)->and($call->claimed_by)->toBe((int) $agent->id);
    Http::assertSent(fn ($r) => ($r['action'] ?? null) === 'connect' && $r['to'] === '8801711000000' && $r['session']['sdp'] === OUT_OFFER);

    // Before they pick up there's no answer yet.
    $this->actingAs($agent, 'admin')->postJson(route('admin.leads.calls.outbound-answer', $call->id))
        ->assertStatus(409)->assertJsonPath('error.retryable', true);

    signedPost('/api/webhook/whatsapp', ['entry' => [['changes' => [['value' => [
        'metadata' => ['phone_number_id' => 'PHONE1'],
        'calls' => [['id' => 'wacid.OUT', 'event' => 'connect', 'direction' => 'BUSINESS_INITIATED', 'session' => ['sdp_type' => 'answer', 'sdp' => OUT_ANSWER]]],
    ]]]]]], 'shh')->assertOk();

    expect($call->fresh()->status)->toBe(CallStatus::Answering);

    $this->actingAs($agent, 'admin')->postJson(route('admin.leads.calls.outbound-answer', $call->id))
        ->assertOk()->assertJsonPath('data.session.sdp', OUT_ANSWER);
    $this->actingAs($agent, 'admin')->postJson(route('admin.leads.calls.outbound-connected', $call->id))
        ->assertOk()->assertJsonPath('data.call.status', 'connected');
    $this->actingAs($agent, 'admin')->postJson(route('admin.leads.calls.hangup', $call->id))->assertOk();

    expect($call->fresh()->status)->toBe(CallStatus::Completed)
        ->and(LeadCallSdp::readAnswer($call->lead_source_id, 'wacid.OUT'))->toBeNull();
});

it('records "they declined" and lets the caller cancel while it rings', function () {
    [$lead, $agent] = callableLead();
    Http::fake([
        'graph.facebook.com/*/call_permissions*' => Http::response(permissionResponse('temporary', true)),
        'graph.facebook.com/v26.0/PHONE1/calls' => Http::sequence()->push(['calls' => [['id' => 'wacid.A']]])->push(['calls' => [['id' => 'wacid.B']]]),
        'graph.facebook.com/v25.0/PHONE1/calls' => Http::response(['success' => true]),
    ]);

    $this->actingAs($agent, 'admin')->postJson(route('admin.leads.call', $lead), ['sdp' => OUT_OFFER])->assertOk();
    $value = fn (array $extra) => ['entry' => [['changes' => [['value' => ['metadata' => ['phone_number_id' => 'PHONE1'], ...$extra]]]]]];
    signedPost('/api/webhook/whatsapp', $value(['statuses' => [['id' => 'wacid.A', 'type' => 'call', 'status' => 'REJECTED']]]), 'shh');
    signedPost('/api/webhook/whatsapp', $value(['calls' => [['id' => 'wacid.A', 'event' => 'terminate', 'direction' => 'BUSINESS_INITIATED']]]), 'shh');

    expect(LeadCall::query()->where('external_call_id', 'wacid.A')->sole()->end_reason)->toBe(CallEndReason::ConsumerDeclinedOutbound);

    $second = $this->actingAs($agent, 'admin')->postJson(route('admin.leads.call', $lead), ['sdp' => OUT_OFFER])->json('data.call.id');
    $this->actingAs($agent, 'admin')->postJson(route('admin.leads.calls.cancel', $second))->assertOk();

    expect(LeadCall::find($second)->end_reason)->toBe(CallEndReason::AgentCancelledOutbound);
    Http::assertSent(fn ($r) => ($r['action'] ?? null) === 'terminate' && ($r['call_id'] ?? null) === 'wacid.B');
});

it('lets managers create the permission message with Meta', function () {
    [$lead] = callableLead();
    Http::fake(['graph.facebook.com/*/WABA1/message_templates' => Http::response(['id' => 'T1', 'status' => 'PENDING'])]);

    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->post(route('admin.leads.calling.template', $lead->source_id))
        ->assertSessionHas('success');

    Http::assertSent(fn ($r) => ($r['category'] ?? null) === 'UTILITY'
        && $r['components'][0]['text'] === 'We would like to call you to discuss your inquiry. Do you give us permission to call you on WhatsApp?'
        && $r['components'][2]['type'] === 'call_permission_request');
});
