<?php

namespace App\Leads\Services;

use App\Leads\Notifications\LeadNotification;
use App\Models\Admin;

/**
 * Sends an alert to every manager (and the mother admin) except the person
 * who caused it — e.g. "Rahim rescheduled the meeting for Jane".
 */
class LeadAdminNotifier
{
    public function __construct(private readonly LeadPeople $people) {}

    public function notifyExcept(?Admin $actor, LeadNotification $notification): void
    {
        $this->people->managers()
            ->reject(fn (Admin $manager): bool => $actor !== null && (int) $manager->id === (int) $actor->id)
            ->each(fn (Admin $manager) => $manager->notify($notification));
    }
}
