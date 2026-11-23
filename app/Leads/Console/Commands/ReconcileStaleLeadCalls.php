<?php

namespace App\Leads\Console\Commands;

use App\Leads\Calling\FinalizeStaleLeadCalls;
use Illuminate\Console\Command;

/**
 * Every minute: end WhatsApp calls whose "terminate" never arrived.
 */
class ReconcileStaleLeadCalls extends Command
{
    protected $signature = 'calls:reconcile-stale';

    protected $description = 'End WhatsApp calls that Meta never closed';

    public function handle(FinalizeStaleLeadCalls $finalize): int
    {
        $summary = $finalize->handle();

        if ($summary['ended'] > 0) {
            $this->info("Ended {$summary['ended']} stale call(s).");
        }

        return self::SUCCESS;
    }
}
