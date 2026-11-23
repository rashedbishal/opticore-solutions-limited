<?php

namespace App\Leads\Notifications;

use App\Leads\Models\Lead;
use Illuminate\Notifications\Notification;

/**
 * Base for every lead alert: stored in the database for the CMS bell (the
 * bell's live refresh comes from BroadcastAdminNotification). Each alert
 * stores raw facts; LeadNotificationPresenter turns them into words.
 */
abstract class LeadNotification extends Notification
{
    public function __construct(public Lead $lead) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    abstract public function toArray(object $notifiable): array;
}
