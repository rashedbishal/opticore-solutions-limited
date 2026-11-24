<?php

namespace App\Console\Commands;

use App\Support\StorageCleanup\AutomaticCleanup;
use Illuminate\Console\Command;

/**
 * Nightly: removes certain leftovers and empties the recycle bin of items
 * older than 7 days. Anything else unused is only removed by the mother
 * admin from the Storage page.
 */
class CleanStorage extends Command
{
    protected $signature = 'storage:clean';

    protected $description = 'Delete leftover temporary/failed-send files and expired recycle-bin items';

    public function handle(AutomaticCleanup $cleanup): int
    {
        $done = $cleanup->run();
        $this->info(sprintf(
            'Removed %d temporary file(s), %d import file(s), %d failed-send file(s), %d expired recycle-bin item(s).',
            $done['temp'], $done['imports'], $done['failed_messages'], $done['recycle_bin'],
        ));

        return self::SUCCESS;
    }
}
