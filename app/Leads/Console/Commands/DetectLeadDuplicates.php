<?php

namespace App\Leads\Console\Commands;

use App\Leads\Models\Lead;
use App\Leads\Services\LeadDuplicateDetector;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

/**
 * Nightly backfill: records duplicate pairs among leads nobody has opened
 * (opening a lead already checks it live).
 */
class DetectLeadDuplicates extends Command
{
    protected $signature = 'leads:detect-duplicates';

    protected $description = 'Find leads that share an email or phone and flag them for merging';

    public function handle(LeadDuplicateDetector $detector): int
    {
        Lead::query()
            ->where(fn ($q) => $q->whereNotNull('email_normalized')->orWhereNotNull('phone_normalized'))
            ->chunkById(200, function (Collection $leads) use ($detector): void {
                foreach ($leads as $lead) {
                    $detector->detectFor($lead);
                }
            });

        return self::SUCCESS;
    }
}
