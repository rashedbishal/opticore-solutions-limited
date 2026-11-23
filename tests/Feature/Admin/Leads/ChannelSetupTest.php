<?php

require_once __DIR__.'/ChannelHelpers.php';

use App\Leads\Enums\LeadSourceType;
use App\Leads\Enums\TokenCheckStatus;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadAttachment;
use App\Leads\Models\LeadSource;
use App\Models\Admin;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

it('lets the mother admin add a channel, requiring its keys', function () {
    $mother = Admin::factory()->create();

    $this->actingAs($mother, 'admin')
        ->post(route('admin.lead-settings.sources.store'), ['type' => 'facebook_messenger', 'name' => 'Page', 'config' => ['page_id' => 'P1']])
        ->assertSessionHasErrors(['config.page_access_token', 'config.verify_token']);

    $this->actingAs($mother, 'admin')
        ->post(route('admin.lead-settings.sources.store'), ['type' => 'facebook_messenger', 'name' => 'Page', 'config' => ['page_id' => 'P1', 'page_access_token' => 'tok', 'verify_token' => 'v']])
        ->assertSessionHasNoErrors();

    expect(LeadSource::where('type', 'facebook_messenger')->sole()->config['page_access_token'])->toBe('tok');
});

it('keeps saved secrets when they are left blank on edit', function () {
    $mother = Admin::factory()->create();
    $source = metaSource(LeadSourceType::FacebookMessenger);

    $this->actingAs($mother, 'admin')
        ->put(route('admin.lead-settings.sources.update', $source), ['name' => 'Renamed', 'config' => ['page_id' => 'PAGE9', 'page_access_token' => '', 'verify_token' => '']])
        ->assertSessionHasNoErrors();

    expect($source->fresh())
        ->name->toBe('Renamed')
        ->config->toMatchArray(['page_id' => 'PAGE9', 'page_access_token' => 'page-token']);
});

it('never sends secrets to the page, and hides setup from everyone but the mother admin', function () {
    metaSource(LeadSourceType::Whatsapp);

    $this->actingAs(Admin::factory()->create(), 'admin')
        ->get(route('admin.leads.sources.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('canManage', true)
            ->where('sources', fn ($sources) => collect($sources)->firstWhere('type', 'whatsapp')['config']['access_token'] === ['saved' => true]));

    $this->flushSession();

    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->get(route('admin.leads.sources.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('canManage', false)
            ->where('sources', fn ($sources) => ! array_key_exists('config', collect($sources)->firstWhere('type', 'whatsapp'))));
});

it('blocks managers from changing channels', function () {
    $source = metaSource(LeadSourceType::Whatsapp);

    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->post(route('admin.lead-settings.sources.toggle', $source))
        ->assertForbidden();
});

it('only deletes a channel that never brought in leads', function () {
    $mother = Admin::factory()->create();
    $used = metaSource(LeadSourceType::Whatsapp);
    Lead::factory()->fromSource($used)->create();
    $unused = metaSource(LeadSourceType::Instagram);

    $this->actingAs($mother, 'admin')->delete(route('admin.lead-settings.sources.destroy', $used))->assertSessionHas('error');
    $this->actingAs($mother, 'admin')->delete(route('admin.lead-settings.sources.destroy', $unused))->assertSessionHas('success');

    expect(LeadSource::find($used->id))->not->toBeNull()->and(LeadSource::find($unused->id))->toBeNull();
});

it('tests a Facebook channel and subscribes the Page', function () {
    $source = metaSource(LeadSourceType::FacebookLeadAds);
    Http::fake([
        'graph.facebook.com/PAGE1/subscribed_apps' => Http::response(['success' => true]),
        'graph.facebook.com/PAGE1*' => Http::response(['id' => 'PAGE1', 'name' => 'Opticore']),
    ]);

    $this->actingAs(Admin::factory()->create(), 'admin')
        ->post(route('admin.lead-settings.sources.test', $source))
        ->assertSessionHas('success', 'Connected to Facebook Page "Opticore" and subscribed it to receive lead ad submissions.');

    Http::assertSent(fn ($request) => str_contains($request->url(), 'subscribed_apps') && $request['subscribed_fields'] === 'leadgen');
});

it('checks keys daily and warns when one is rejected', function () {
    $source = metaSource(LeadSourceType::FacebookMessenger);
    Http::fake(['graph.facebook.com/debug_token*' => Http::response(['data' => ['is_valid' => false, 'error' => ['message' => 'Session expired']]])]);

    $this->artisan('leads:check-meta-tokens')->assertSuccessful();

    expect($source->tokenCheck()->first()->status)->toBe(TokenCheckStatus::Invalid);

    $this->actingAs(Admin::factory()->create(), 'admin')
        ->get(route('admin.leads.sources.index'))
        ->assertInertia(fn (Assert $page) => $page->where('sources', fn ($sources) => collect($sources)->firstWhere('id', $source->id)['health']['problems'][0]['problem'] === 'token_invalid'));
});

it('opens an attachment only for someone who can see the lead', function () {
    Storage::fake('local');
    Storage::disk('local')->put('leads/whatsapp/a.jpg', 'jpeg-bytes');
    $agent = Admin::factory()->leadAgent()->create();
    $lead = Lead::factory()->assignedTo($agent)->create();
    $attachment = LeadAttachment::create(['lead_id' => $lead->id, 'type' => 'image', 'status' => 'downloaded', 'path' => 'leads/whatsapp/a.jpg', 'mime' => 'image/jpeg']);

    $this->actingAs($agent, 'admin')->get(route('admin.leads.attachments.show', $attachment))->assertOk();

    $this->flushSession();
    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')
        ->get(route('admin.leads.attachments.show', $attachment))
        ->assertForbidden();
});
