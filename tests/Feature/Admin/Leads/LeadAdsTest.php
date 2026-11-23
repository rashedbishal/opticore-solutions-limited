<?php

require_once __DIR__.'/ChannelHelpers.php';

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Models\Admin;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

function leadgenPayload(string $leadgenId): array
{
    return ['object' => 'page', 'entry' => [['id' => 'PAGE1', 'changes' => [[
        'field' => 'leadgen',
        'value' => ['leadgen_id' => $leadgenId, 'page_id' => 'PAGE1', 'form_id' => 'FORM1'],
    ]]]]];
}

function fakeLeadgen(): void
{
    Http::fake([
        'graph.facebook.com/v20.0/LG1*' => Http::response(['ad_id' => 'AD1', 'field_data' => [
            ['name' => 'full_name', 'values' => ['Nadia Islam']],
            ['name' => 'email', 'values' => ['nadia@example.com']],
            ['name' => 'phone_number', 'values' => ['+8801811000000']],
            ['name' => 'budget_range', 'values' => ['=1+1']],
        ]]),
        'graph.facebook.com/v20.0/FORM1*' => Http::response(['name' => 'Winter Offer Form']),
        'graph.facebook.com/*' => Http::response([], 500),
    ]);
}

it('turns a Lead Ads submission into a lead, once', function () {
    metaSource(LeadSourceType::FacebookLeadAds);
    fakeLeadgen();

    signedPost('/api/webhook/facebook', leadgenPayload('LG1'))->assertOk();
    signedPost('/api/webhook/facebook', leadgenPayload('LG1'))->assertOk();

    $lead = Lead::sole();

    expect($lead->name)->toBe('Nadia Islam')
        ->and($lead->email)->toBe('nadia@example.com')
        ->and($lead->phone)->toBe('+8801811000000')
        ->and($lead->source_data['form_name'])->toBe('Winter Offer Form')
        ->and($lead->leadAdFieldValues())->toHaveKey('budget_range');
});

it('still keeps the lead when Meta won\'t share the answers', function () {
    metaSource(LeadSourceType::FacebookLeadAds);
    Http::fake(['graph.facebook.com/*' => Http::response(['error' => ['code' => 100, 'error_subcode' => 33]], 400)]);

    signedPost('/api/webhook/facebook', leadgenPayload('LG77'))->assertOk();

    expect(Lead::sole())
        ->name->toBe('Facebook Lead LG77')
        ->source_data->toMatchArray(['fetch_failed' => true]);
});

it('groups Lead Ads on the managers\' list and shows them as a spreadsheet', function () {
    $source = metaSource(LeadSourceType::FacebookLeadAds);
    fakeLeadgen();
    signedPost('/api/webhook/facebook', leadgenPayload('LG1'));
    Lead::factory()->create();
    $manager = Admin::factory()->leadManager()->create();

    $this->actingAs($manager, 'admin')
        ->get(route('admin.leads.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('leads.total', 1)
            ->where('adSources.0.leads_count', 1));

    $this->actingAs($manager, 'admin')
        ->get(route('admin.leads.ad-sources.show', $source))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Leads/AdSourceLeads')
            ->where('columns', ['full_name', 'email', 'phone_number', 'budget_range'])
            ->where('leads.data.0.fields.budget_range', '=1+1'));

    $this->actingAs($manager, 'admin')
        ->get(route('admin.leads.ad-sources.export', $source))
        ->assertOk()
        ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

it('shows Lead Ads leads as normal cards to the agent who owns them', function () {
    metaSource(LeadSourceType::FacebookLeadAds);
    fakeLeadgen();
    signedPost('/api/webhook/facebook', leadgenPayload('LG1'));
    $agent = Admin::factory()->leadAgent()->create();
    Lead::sole()->update(['assigned_to' => $agent->id]);

    $this->actingAs($agent, 'admin')
        ->get(route('admin.leads.index'))
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Leads/Board')->has('leads', 1));
});
