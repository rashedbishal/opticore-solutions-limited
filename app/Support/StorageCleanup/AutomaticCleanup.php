<?php

namespace App\Support\StorageCleanup;

use App\Leads\Enums\MessageStatus;
use App\Leads\Models\LeadMessage;
use Illuminate\Support\Facades\Storage;

/**
 * The nightly, no-questions clean-up — only files that are certainly
 * leftovers (the rest waits for the mother admin on the Storage page):
 *
 * - temporary email attachments a failed send left behind (3+ days old);
 * - lead import files an interrupted import left behind (2+ days old);
 * - pictures/PDFs of WhatsApp/Messenger messages that failed to send, 7
 *   days after the failure (the message stays, shown as "file removed");
 * - recycle-bin items older than 7 days.
 */
class AutomaticCleanup
{
    public function __construct(private readonly StorageRecycleBin $bin) {}

    /**
     * @return array{temp: int, imports: int, failed_messages: int, recycle_bin: int}
     */
    public function run(): array
    {
        return [
            'temp' => $this->deleteOlderThan('local', 'temp', 3),
            'imports' => $this->deleteOlderThan('local', 'leads/imports', 2),
            'failed_messages' => $this->failedMessageFiles(),
            'recycle_bin' => $this->bin->purgeExpired(),
        ];
    }

    private function deleteOlderThan(string $disk, string $folder, int $days): int
    {
        $storage = Storage::disk($disk);
        $cutoff = now()->subDays($days)->getTimestamp();
        $count = 0;

        foreach ($storage->allFiles($folder) as $path) {
            if (! str_starts_with(basename($path), '.') && $storage->lastModified($path) < $cutoff) {
                $storage->delete($path);
                $count++;
            }
        }

        return $count;
    }

    private function failedMessageFiles(): int
    {
        $count = 0;

        LeadMessage::query()
            ->where('status', MessageStatus::Failed)
            ->whereNotNull('attachment_path')
            ->where('updated_at', '<', now()->subDays(7))
            ->each(function (LeadMessage $message) use (&$count): void {
                Storage::disk('local')->delete((string) $message->attachment_path);
                $message->forceFill(['attachment_path' => null])->saveQuietly();
                $count++;
            });

        return $count;
    }
}
