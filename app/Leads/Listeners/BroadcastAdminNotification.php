<?php

namespace App\Leads\Listeners;

use App\Leads\Events\AdminNotified;
use App\Models\Admin;
use Illuminate\Notifications\Events\NotificationSent;

/**
 * Fires the live bell refresh for every database notification sent to an
 * admin, so each new lead alert type gets real-time delivery for free
 * instead of every call site broadcasting by hand.
 */
class BroadcastAdminNotification
{
    public function handle(NotificationSent $event): void
    {
        if ($event->channel !== 'database' || ! $event->notifiable instanceof Admin) {
            return;
        }

        event(new AdminNotified($event->notifiable));
    }
}
