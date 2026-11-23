<?php

namespace App\Leads\Notifications;

/**
 * Daily 08:00 reminder while the lead's meeting reminder is showing.
 */
class MeetingAlertNotification extends LeadNotification
{
    public function toArray(object $notifiable): array
    {
        return [
            'lead_id' => $this->lead->id,
            'name' => $this->lead->name,
            'meeting_date' => $this->lead->meeting_date?->toDateString(),
            'meeting_time' => $this->lead->meetingTimeFormatted(),
        ];
    }
}
