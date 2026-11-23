<?php

namespace App\Leads\Console\Commands;

use App\Leads\Models\LeadAttachment;
use App\Leads\Models\LeadMessage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Daily: deletes attachment files that no longer belong to any lead (e.g.
 * after the lead was deleted). Files younger than an hour are left alone
 * so a download in progress is never removed.
 */
class CleanupOrphanedLeadAttachments extends Command
{
    private const GRACE_PERIOD_MINUTES = 60;

    protected $signature = 'leads:cleanup-attachments';

    protected $description = 'Delete lead attachment files that no longer belong to any lead';

    public function handle(): int
    {
        $disk = Storage::disk('local');

        if (! $disk->exists('leads')) {
            $this->info('Nothing to clean up.');

            return self::SUCCESS;
        }

        $known = array_flip([
            ...LeadAttachment::query()->whereNotNull('path')->pluck('path')->all(),
            ...LeadMessage::query()->whereNotNull('attachment_path')->pluck('attachment_path')->all(),
        ]);
        $cutoff = now()->subMinutes(self::GRACE_PERIOD_MINUTES)->timestamp;
        $deleted = 0;

        foreach ($disk->allFiles('leads') as $path) {
            if (isset($known[$path]) || $disk->lastModified($path) > $cutoff) {
                continue;
            }

            $disk->delete($path);
            $deleted++;
        }

        $this->info("Deleted {$deleted} orphaned attachment file(s).");

        return self::SUCCESS;
    }
}
