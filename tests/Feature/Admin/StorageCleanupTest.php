<?php

require_once __DIR__.'/Leads/ChannelHelpers.php';

use App\Leads\Enums\LeadSourceType;
use App\Leads\Enums\MessageChannel;
use App\Leads\Enums\MessageDirection;
use App\Leads\Enums\MessageStatus;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadConversation;
use App\Leads\Models\LeadMessage;
use App\Models\Admin;
use App\Models\Blog;
use App\Models\StorageRecycleItem;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('public');
    Storage::fake('local');
});

function oldFile(string $disk, string $path, int $daysAgo = 3): void
{
    Storage::disk($disk)->put($path, 'data');
    touch(Storage::disk($disk)->path($path), now()->subDays($daysAgo)->getTimestamp());
}

function failedSend(string $path, int $daysAgo): LeadMessage
{
    $source = metaSource(LeadSourceType::Whatsapp);
    $lead = Lead::factory()->fromSource($source)->create();
    $conversation = LeadConversation::create(['lead_id' => $lead->id, 'lead_source_id' => $source->id, 'channel' => MessageChannel::Whatsapp, 'external_thread_id' => '8801711000000']);
    Storage::disk('local')->put($path, 'img');

    $message = LeadMessage::create(['conversation_id' => $conversation->id, 'lead_id' => $lead->id, 'channel' => 'whatsapp', 'direction' => MessageDirection::Outbound, 'message_type' => 'image', 'attachment_path' => $path, 'attachment_name' => 'logo.png', 'status' => MessageStatus::Failed]);
    LeadMessage::whereKey($message->id)->update(['updated_at' => now()->subDays($daysAgo)]);

    return $message;
}

it('is hidden from other admins', function (string $state) {
    $this->actingAs(Admin::factory()->{$state}()->create(), 'admin')
        ->get(route('admin.storage-cleanup.index'))->assertForbidden();
})->with(['fullAccess', 'leadManager']);

it('opens for the mother admin', function () {
    $this->actingAs(Admin::factory()->create(), 'admin')
        ->get(route('admin.storage-cleanup.index'))->assertOk();
});

it('lists only files nothing uses, never new or protected ones', function () {
    Blog::factory()->create(['image' => 'blogs/used.webp']);
    oldFile('public', 'blogs/used.webp');
    oldFile('public', 'blogs/orphan.webp');
    oldFile('local', 'resumes/old-cv.pdf');
    oldFile('local', 'invoices/INV-1.pdf');
    Storage::disk('public')->put('blogs/just-uploaded.webp', 'x');

    $this->actingAs(Admin::factory()->create(), 'admin')
        ->get(route('admin.storage-cleanup.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/StorageCleanup/Index')
            ->where('unusedTotal.files', 2)
            ->where('unused', fn ($files) => collect($files)->pluck('path')->sort()->values()->all() === ['blogs/orphan.webp', 'resumes/old-cv.pdf']));
});

it('moves unused files to the recycle bin, and restores or deletes them', function () {
    Blog::factory()->create(['image' => 'blogs/used.webp']);
    oldFile('public', 'blogs/used.webp');
    oldFile('public', 'blogs/orphan.webp');
    $this->actingAs(Admin::factory()->create(), 'admin');

    // A file something uses is refused even if sent.
    $this->post(route('admin.storage-cleanup.recycle'), ['files' => [
        ['disk' => 'public', 'path' => 'blogs/orphan.webp'],
        ['disk' => 'public', 'path' => 'blogs/used.webp'],
    ]])->assertSessionHas('success', '1 file(s) moved to the recycle bin. 1 skipped (now in use or already gone).');

    Storage::disk('public')->assertMissing('blogs/orphan.webp');
    Storage::disk('public')->assertExists('blogs/used.webp');
    $item = StorageRecycleItem::sole();

    $this->post(route('admin.storage-cleanup.bin.restore', $item))->assertSessionHas('success');
    Storage::disk('public')->assertExists('blogs/orphan.webp');
    expect(StorageRecycleItem::count())->toBe(0);

    $this->post(route('admin.storage-cleanup.recycle'), ['files' => [['disk' => 'public', 'path' => 'blogs/orphan.webp']]]);
    $item = StorageRecycleItem::sole();
    $this->delete(route('admin.storage-cleanup.bin.destroy', $item))->assertSessionHas('success');

    expect(StorageRecycleItem::count())->toBe(0)
        ->and(Storage::disk('local')->allFiles('storage-recycle'))->toBe([]);
    Storage::disk('public')->assertMissing('blogs/orphan.webp');
});

it('never touches protected folders or paths outside storage', function () {
    oldFile('local', 'invoices/INV-1.pdf');
    $this->actingAs(Admin::factory()->create(), 'admin');

    $this->post(route('admin.storage-cleanup.recycle'), ['files' => [
        ['disk' => 'local', 'path' => 'invoices/INV-1.pdf'],
        ['disk' => 'local', 'path' => '../.env'],
    ]])->assertSessionHas('success', '0 file(s) moved to the recycle bin. 2 skipped (now in use or already gone).');

    Storage::disk('local')->assertExists('invoices/INV-1.pdf');
    $this->get(route('admin.storage-cleanup.preview', ['disk' => 'local', 'path' => '../.env']))->assertNotFound();
});

it('nightly removes leftovers, failed-send files after 7 days, and expired bin items', function () {
    oldFile('local', 'temp/custom-emails/old.pdf', 4);
    oldFile('local', 'temp/custom-emails/fresh.pdf', 1);
    $oldFailure = failedSend('leads/outbound/whatsapp/old.png', 8);
    $newFailure = failedSend('leads/outbound/whatsapp/new.png', 2);
    Storage::disk('local')->put('storage-recycle/x/gone.png', 'x');
    StorageRecycleItem::create(['disk' => 'public', 'original_path' => 'blogs/gone.png', 'bin_path' => 'storage-recycle/x/gone.png', 'size' => 1, 'expires_at' => now()->subMinute()]);

    $this->artisan('storage:clean')->assertSuccessful();

    Storage::disk('local')->assertMissing('temp/custom-emails/old.pdf');
    Storage::disk('local')->assertExists('temp/custom-emails/fresh.pdf');
    Storage::disk('local')->assertMissing('leads/outbound/whatsapp/old.png');
    Storage::disk('local')->assertExists('leads/outbound/whatsapp/new.png');
    Storage::disk('local')->assertMissing('storage-recycle/x/gone.png');
    expect($oldFailure->fresh()->attachment_path)->toBeNull()
        ->and($oldFailure->fresh()->attachment_name)->toBe('logo.png')
        ->and($newFailure->fresh()->attachment_path)->not->toBeNull()
        ->and(StorageRecycleItem::count())->toBe(0);
});
