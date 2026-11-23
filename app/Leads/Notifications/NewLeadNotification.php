<?php

namespace App\Leads\Notifications;

class NewLeadNotification extends LeadNotification
{
    public function toArray(object $notifiable): array
    {
        return [
            'lead_id' => $this->lead->id,
            'name' => $this->lead->name,
            'source_type' => $this->lead->source->type->value,
            'source_name' => $this->lead->source->name,
        ];
    }
}
