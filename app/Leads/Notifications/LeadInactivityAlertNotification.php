<?php

namespace App\Leads\Notifications;

use App\Leads\Models\Lead;
use Illuminate\Notifications\Notification;

class LeadInactivityAlertNotification extends Notification
{
    public function __construct(public Lead $lead, public int $daysInactive) {}

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
    public function toArray(object $notifiable): array
    {
        return [
            'lead_id' => $this->lead->id,
            'identifier' => $this->lead->identifier,
            'name' => $this->lead->name,
            'days_inactive' => $this->daysInactive,
        ];
    }
}
