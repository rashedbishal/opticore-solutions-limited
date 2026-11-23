<?php

namespace App\Leads\Services;

use App\Leads\Models\LeadSource;
use App\Leads\Notifications\InboxCannotConnectNotification;
use App\Models\Admin;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Counts consecutive failed connections per email inbox (same rules as
 * OptiFin's ImapConnectionHealthMonitor). Reaching the threshold alerts the
 * mother admin exactly once; a successful connection resets the count.
 * Monitoring problems are logged, never thrown.
 */
class InboxHealth
{
    public function recordFailure(LeadSource $source): void
    {
        try {
            $key = $this->key($source);
            Cache::add($key, 0, now()->addMinutes((int) config('leads.imap_failure_window_minutes')));
            $failures = (int) Cache::increment($key);

            if ($failures !== (int) config('leads.imap_failure_threshold')) {
                return;
            }

            Log::critical("Lead source [{$source->id}] email inbox has failed to connect {$failures} times in a row.");

            Admin::motherAdmin()?->notify(new InboxCannotConnectNotification($source, $failures));
        } catch (Throwable $e) {
            Log::warning('Email inbox health monitoring could not complete.', ['exception' => $e::class]);
        }
    }

    public function recordSuccess(LeadSource $source): void
    {
        try {
            Cache::forget($this->key($source));
        } catch (Throwable $e) {
            Log::warning('Email inbox health monitoring could not complete.', ['exception' => $e::class]);
        }
    }

    public function consecutiveFailures(LeadSource $source): int
    {
        try {
            return (int) Cache::get($this->key($source), 0);
        } catch (Throwable) {
            return 0;
        }
    }

    private function key(LeadSource $source): string
    {
        return "leads:imap-connection-failures:{$source->id}";
    }
}
