<?php

namespace App\Console\Commands;

use App\Models\CheckoutMetadata;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

#[Signature('checkout:prune-uploads')]
#[Description('Delete checkout_metadata rows and temp files that were never tied to a payment (upload abandoned before Pay Now).')]
class PruneOrphanedCheckoutUploads extends Command
{
    public function handle(): int
    {
        // Rows with no transaction_id were created during a pre-upload but the
        // user never clicked Pay Now (or refreshed before paying). Give them a
        // 24-hour grace window in case the browser tab is still open.
        $orphans = CheckoutMetadata::whereNull('transaction_id')
            ->where('created_at', '<', now()->subMinutes(20))
            ->get();

        if ($orphans->isEmpty()) {
            $this->line('No orphaned uploads found.');

            return self::SUCCESS;
        }

        $deletedFiles = 0;
        $deletedRows = 0;

        foreach ($orphans as $metadata) {
            if ($metadata->attachment_paths) {
                foreach ($metadata->attachment_paths as $file) {
                    if (Storage::disk('local')->exists($file['path'])) {
                        Storage::disk('local')->delete($file['path']);
                        $deletedFiles++;
                    }
                }

                // Remove the now-empty upload directory if it exists
                $dir = 'task_uploads/pending/'.$metadata->upload_token;
                if (Storage::disk('local')->exists($dir)) {
                    Storage::disk('local')->deleteDirectory($dir);
                }
            }

            $metadata->delete();
            $deletedRows++;
        }

        $this->info("Pruned {$deletedRows} orphaned upload(s), deleted {$deletedFiles} file(s).");

        return self::SUCCESS;
    }
}
