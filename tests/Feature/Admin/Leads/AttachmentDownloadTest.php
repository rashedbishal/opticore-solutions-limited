<?php

require_once __DIR__.'/ChannelHelpers.php';

use App\Leads\Enums\LeadAttachmentStatus;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Jobs\DownloadLeadAttachment;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadAttachment;
use App\Leads\Services\Meta\MetaGraph;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

function pendingAttachment(LeadSourceType $type): LeadAttachment
{
    $lead = Lead::factory()->fromSource(metaSource($type))->create();

    return LeadAttachment::create(['lead_id' => $lead->id, 'type' => 'image', 'status' => LeadAttachmentStatus::Downloading]);
}

it('refuses to download from anywhere but Meta\'s own media servers', function () {
    $attachment = pendingAttachment(LeadSourceType::FacebookMessenger);
    Http::fake();

    (new DownloadLeadAttachment($attachment, 'PSID', 'facebook_messenger', 'https://evil.example.com/x.jpg'))->handle(app(MetaGraph::class));

    expect($attachment->fresh()->status)->toBe(LeadAttachmentStatus::Failed);
    Http::assertNothingSent();
});

it('saves a WhatsApp picture privately', function () {
    Storage::fake('local');
    $attachment = pendingAttachment(LeadSourceType::Whatsapp);
    Http::fake([
        'graph.facebook.com/v21.0/MEDIA1*' => Http::response(['url' => 'https://lookaside.fbsbx.com/m/1', 'mime_type' => 'image/jpeg']),
        'lookaside.fbsbx.com/*' => Http::response('jpeg-bytes'),
    ]);

    (new DownloadLeadAttachment($attachment, '8801711000000', 'whatsapp', mediaId: 'MEDIA1'))->handle(app(MetaGraph::class));

    $attachment->refresh();

    expect($attachment->status)->toBe(LeadAttachmentStatus::Downloaded)
        ->and($attachment->mime)->toBe('image/jpeg')
        ->and($attachment->path)->toStartWith('leads/whatsapp/');
    Storage::disk('local')->assertExists($attachment->path);
});

it('subscribes Pages to Lead Ads and fetches a test Lead Ad from the command line', function () {
    $source = metaSource(LeadSourceType::FacebookLeadAds);
    Http::fake([
        'graph.facebook.com/PAGE1/subscribed_apps' => Http::response(['success' => true]),
        'graph.facebook.com/v20.0/LG5*' => Http::response(['field_data' => [['name' => 'full_name', 'values' => ['Test Person']]]]),
        'graph.facebook.com/*' => Http::response([], 404),
    ]);

    $this->artisan('meta:subscribe-leadgen', ['leadSourceId' => $source->id])->assertSuccessful();
    $this->artisan('leads:fetch-test', ['leadgen_id' => 'LG5'])->assertSuccessful();

    expect(Lead::sole()->name)->toBe('Test Person');
});
