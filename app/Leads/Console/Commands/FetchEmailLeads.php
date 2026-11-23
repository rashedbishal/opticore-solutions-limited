<?php

namespace App\Leads\Console\Commands;

use App\Leads\Enums\LeadSourceType;
use App\Leads\Jobs\ProcessEmailLeadSource;
use App\Leads\Models\LeadSource;
use Illuminate\Console\Command;

/**
 * Every minute: queues a check of each active email inbox that is due
 * (each inbox has its own "check every N minutes", default 15).
 */
class FetchEmailLeads extends Command
{
    protected $signature = 'leads:fetch-emails';

    protected $description = 'Fetch unread emails from active email lead sources and create leads from them';

    public function handle(): int
    {
        if (! extension_loaded('imap')) {
            $this->error('The IMAP extension is not available on this server.');

            return self::FAILURE;
        }

        LeadSource::query()
            ->where('type', LeadSourceType::Email)
            ->where('is_active', true)
            ->get()
            ->filter(fn (LeadSource $source): bool => $source->last_synced_at === null
                || $source->last_synced_at->copy()->addMinutes((int) ($source->config['fetch_interval_minutes'] ?? 15))->isPast())
            ->each(fn (LeadSource $source) => ProcessEmailLeadSource::dispatch($source));

        return self::SUCCESS;
    }
}
