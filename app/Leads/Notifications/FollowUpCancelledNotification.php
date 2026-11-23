<?php

namespace App\Leads\Notifications;

use App\Leads\Models\Lead;

/**
 * A followup was cancelled; sent to the other managers.
 */
class FollowUpCancelledNotification extends LeadNotification
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
            'next_follow_up_at' => $this->lead->next_follow_up_at?->toDateString(),
        ];
    }
}
