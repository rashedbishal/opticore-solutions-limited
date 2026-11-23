<?php

namespace App\Leads\Notifications;

/**
 * Daily 08:00 reminder while the lead's followup reminder is showing.
 */
class FollowUpAlertNotification extends LeadNotification
{
    public function toArray(object $notifiable): array
    {
        return [
            'lead_id' => $this->lead->id,
            'name' => $this->lead->name,
            'next_follow_up_at' => $this->lead->next_follow_up_at?->toDateString(),
        ];
    }
}
