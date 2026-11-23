<?php

namespace App\Leads\Console\Commands;

use App\Leads\Enums\FailedEmailMessageStatus;
use App\Leads\Jobs\ProcessEmailLeadSource;
use App\Leads\Models\FailedEmailMessage;
use App\Leads\Models\LeadSource;
use Illuminate\Console\Command;

/**
 * Every 15 minutes: retries emails that failed to import and are due.
 */
class RetryFailedEmailMessages extends Command
{
    protected $signature = 'leads:retry-failed-emails {--limit=25 : Most due emails to retry in one run}';

    protected $description = 'Retry email lead imports that failed and are due for another attempt';

    public function handle(): int
    {
        if (! extension_loaded('imap')) {
            $this->error('The IMAP extension is not available on this server.');

            return self::FAILURE;
        }

        $due = FailedEmailMessage::query()
            ->where('status', FailedEmailMessageStatus::Failed)
            ->where('next_retry_at', '<=', now())
            ->orderBy('next_retry_at')
            ->limit(max(1, (int) $this->option('limit')))
            ->get()
            ->groupBy('lead_source_id');

        foreach ($due as $sourceId => $records) {
            $source = LeadSource::query()->find($sourceId);

            if ($source !== null && $source->is_active) {
                ProcessEmailLeadSource::dispatch($source, $records->pluck('id')->map(fn ($id): int => (int) $id)->all());
            }
        }

        return self::SUCCESS;
    }
}
