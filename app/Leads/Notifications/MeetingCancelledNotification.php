<?php

namespace App\Leads\Notifications;

use App\Leads\Models\Lead;

/**
 * A meeting was cancelled; sent to the other managers.
 */
class MeetingCancelledNotification extends LeadNotification
{
    public function __construct(Lead $lead, public string $cancelledByName)
    {
        parent::__construct($lead);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'lead_id' => $this->lead->id,
            'name' => $this->lead->name,
            'cancelled_by' => $this->cancelledByName,
            'meeting_date' => $this->lead->meeting_date?->toDateString(),
        ];
    }
}
