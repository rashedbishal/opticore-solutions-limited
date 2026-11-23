<?php

namespace App\Leads\Notifications;

use App\Leads\Models\Lead;

/**
 * A meeting was scheduled or rescheduled; sent to the other managers.
 */
class MeetingUpdatedNotification extends LeadNotification
{
    public function __construct(Lead $lead, public string $changedByName, public bool $rescheduled)
    {
        parent::__construct($lead);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'lead_id' => $this->lead->id,
            'name' => $this->lead->name,
            'changed_by' => $this->changedByName,
            'rescheduled' => $this->rescheduled,
            'meeting_date' => $this->lead->meeting_date?->toDateString(),
            'meeting_time' => $this->lead->meetingTimeFormatted(),
        ];
    }
}
