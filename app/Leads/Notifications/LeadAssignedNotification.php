<?php

namespace App\Leads\Notifications;

use App\Leads\Models\Lead;
use Illuminate\Support\Str;

class LeadAssignedNotification extends LeadNotification
{
    public function __construct(Lead $lead, public ?string $assignedByName)
    {
        parent::__construct($lead);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'lead_id' => $this->lead->id,
            'name' => $this->lead->name,
            'assigned_by' => $this->assignedByName,
            'message' => Str::limit((string) $this->lead->message, 120),
        ];
    }
}
