<?php

namespace App\Leads\Jobs;

use App\Leads\Actions\ImportLeadRow;
use App\Leads\Enums\LeadImportRowStatus;
use App\Leads\Enums\LeadImportStatus;
use App\Leads\Models\LeadImport;
use App\Leads\Support\LeadImportFile;
use App\Models\Admin;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Imports the next batch of rows from an uploaded lead file, then queues
 * itself for the following batch, so each job stays well inside the queue
 * time limit however big the file is.
 */
class ProcessLeadImport implements ShouldQueue
{
    use Queueable;

    public const int BATCH = 200;

    public int $tries = 1;

    public int $timeout = 55;

    public function __construct(public string $importId) {}

    public function handle(ImportLeadRow $importRow): void
    {
        $import = LeadImport::query()->find($this->importId);

        if ($import === null || $import->status->isFinished()) {
            return;
        }

        if ($import->status === LeadImportStatus::Pending) {
            $import->update(['status' => LeadImportStatus::Processing, 'started_at' => now()]);
        }

        $file = new LeadImportFile(Storage::disk('local')->path($import->file_path), $import->file_type);
        $batch = $file->batch($file->headers(), $import->cursor, $import->cursor_row, self::BATCH);
        $importedBy = $import->getAttribute('imported_by') !== null ? Admin::query()->find($import->getAttribute('imported_by')) : null;
        $counts = ['imported_count' => 0, 'duplicate_count' => 0, 'failed_count' => 0];

        foreach ($batch['rows'] as $rowNumber => $row) {
            $status = $importRow->handle($import, $rowNumber, $row, $importedBy);
            $counts[match ($status) {
                LeadImportRowStatus::Imported => 'imported_count',
                LeadImportRowStatus::Duplicate => 'duplicate_count',
                LeadImportRowStatus::Failed => 'failed_count',
            }]++;
        }

        $import->update([
            'cursor' => $batch['cursor'],
            'cursor_row' => $batch['row'],
            'processed_rows' => $import->processed_rows + count($batch['rows']),
            'imported_count' => $import->imported_count + $counts['imported_count'],
            'duplicate_count' => $import->duplicate_count + $counts['duplicate_count'],
            'failed_count' => $import->failed_count + $counts['failed_count'],
        ]);

        if ($batch['done']) {
            $this->finish($import);
        } else {
            self::dispatch($import->id);
        }
    }

    public function failed(?Throwable $exception): void
    {
        $import = LeadImport::query()->find($this->importId);

        if ($import === null || $import->status->isFinished()) {
            return;
        }

        $import->update([
            'status' => LeadImportStatus::Failed,
            'error' => 'The import stopped unexpectedly. Rows already imported are kept.',
            'finished_at' => now(),
        ]);
    }

    private function finish(LeadImport $import): void
    {
        $import->update([
            'status' => $import->failed_count > 0 ? LeadImportStatus::CompletedWithErrors : LeadImportStatus::Completed,
            'finished_at' => now(),
        ]);

        Storage::disk('local')->delete($import->file_path);
    }
}
