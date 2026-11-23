<?php

namespace App\Leads\Console\Commands;

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;
use App\Leads\Services\Meta\MetaGraph;
use Illuminate\Console\Command;

/**
 * Subscribes a Facebook Page to this app's Lead Ads webhook (same as
 * OptiFin's meta:subscribe-leadgen).
 */
class SubscribeLeadgenWebhook extends Command
{
    protected $signature = 'meta:subscribe-leadgen {leadSourceId? : Omit to subscribe every active Lead Ads source}';

    protected $description = 'Subscribe Facebook Page(s) to the leadgen webhook field';

    public function handle(MetaGraph $graph): int
    {
        $id = $this->argument('leadSourceId');
        $sources = LeadSource::query()
            ->where('type', LeadSourceType::FacebookLeadAds)
            ->when($id, fn ($query) => $query->whereKey($id), fn ($query) => $query->where('is_active', true))
            ->get();

        if ($sources->isEmpty()) {
            $this->error('No matching Facebook Lead Ads source.');

            return self::FAILURE;
        }

        $failed = false;

        foreach ($sources as $source) {
            $pageId = (string) ($source->config['page_id'] ?? '');
            $token = (string) ($source->config['page_access_token'] ?? '');

            if ($pageId === '' || $token === '') {
                $this->warn("[{$source->name}] Page ID and Page Access Token must both be set.");
                $failed = true;

                continue;
            }

            $result = $graph->subscribePage($pageId, $token, 'leadgen');

            if ($result['success']) {
                $this->info("[{$source->name}] Page {$pageId} subscribed to leadgen.");
            } else {
                $this->error("[{$source->name}] Subscription failed: {$result['error']}");
                $failed = true;
            }
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
