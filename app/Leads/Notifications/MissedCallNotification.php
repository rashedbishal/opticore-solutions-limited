<?php

namespace App\Leads\Notifications;

use App\Leads\Models\LeadCall;
use Illuminate\Notifications\Notification;

class MissedCallNotification extends Notification
{
    public function __construct(public LeadCall $call, public string $leadName) {}

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
            'lead_id' => $this->call->lead_id,
            'call_id' => $this->call->id,
            'name' => $this->leadName,
            'reason' => $this->call->end_reason?->label(),
        ];
    }
}
