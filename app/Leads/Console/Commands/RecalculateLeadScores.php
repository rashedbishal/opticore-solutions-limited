<?php

namespace App\Leads\Console\Commands;

use App\Leads\Models\Lead;
use App\Leads\Services\LeadScorer;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

/**
 * Nightly (and after rules change): recompute every lead's score, which
 * keeps the "days since …" rules current.
 */
class RecalculateLeadScores extends Command
{
    protected $signature = 'leads:recalculate-scores';

    protected $description = 'Recompute every lead score from the current scoring rules';

    public function handle(LeadScorer $scorer): int
    {
        $scorer->cacheRules();

        Lead::query()->with('source')->chunkById(200, function (Collection $leads) use ($scorer): void {
            foreach ($leads as $lead) {
                $scorer->score($lead);
            }
        });

        return self::SUCCESS;
    }
}
