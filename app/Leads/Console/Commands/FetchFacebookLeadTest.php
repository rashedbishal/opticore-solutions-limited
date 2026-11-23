<?php

namespace App\Leads\Console\Commands;

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;
use App\Leads\Services\Meta\InboundChannels;
use Illuminate\Console\Command;

/**
 * Manually pulls one Facebook Lead Ad by its id, without waiting for a real
 * webhook — for testing a Lead Ads setup (same as OptiFin's
 * leads:fetch-test).
 */
class FetchFacebookLeadTest extends Command
{
    protected $signature = 'leads:fetch-test {leadgen_id} {--source= : Lead Ads source id (defaults to the only active one)}';

    protected $description = 'Fetch one Facebook Lead Ad by id and create its lead';

    public function handle(InboundChannels $channels): int
    {
        $source = LeadSource::query()
            ->where('type', LeadSourceType::FacebookLeadAds)
            ->when($this->option('source'), fn ($query, $id) => $query->whereKey($id), fn ($query) => $query->where('is_active', true))
            ->first();

        if ($source === null) {
            $this->error('No matching Facebook Lead Ads source.');

            return self::FAILURE;
        }

        $channels->leadAd($source, ['leadgen_id' => (string) $this->argument('leadgen_id'), 'page_id' => $source->config['page_id'] ?? null]);
        $this->info('Done. Check the leads list (and the log if nothing appeared).');

        return self::SUCCESS;
    }
}
