<?php

namespace App\Leads\Calling;

use App\Leads\CallingApp\CallingAppDevice;
use App\Leads\CallingApp\CallingAppFirebase;
use App\Models\Admin;
use Illuminate\Support\Carbon;
use Throwable;

/**
 * Whether someone's call box is open: an open CMS tab checks in every
 * 15 seconds; not seen for 45 seconds (or never) counts as away.
 */
class SoftphonePresence
{
    public function isAvailable(Admin $admin): bool
    {
        // A connected phone app rings through Firebase even when no CMS tab
        // is open (approved trade-off, as OptiFin: a switched-off phone
        // can't be detected, so the call ends Missed rather than moving on).
        if (app(CallingAppFirebase::class)->isConfigured()
            && CallingAppDevice::query()->where('admin_id', $admin->id)->whereNotNull('fcm_token')->exists()) {
            return true;
        }

        $seen = $admin->softphone_last_seen_at;

        return $seen !== null && $seen->greaterThan(Carbon::now()->subSeconds((int) config('calling.softphone_presence_stale_seconds')));
    }

    public function touch(Admin $admin): void
    {
        try {
            Admin::query()->whereKey($admin->id)->update(['softphone_last_seen_at' => Carbon::now()]);
        } catch (Throwable $e) {
            report($e);
        }
    }
}
