<?php

namespace App\Leads\Notifications;

use App\Leads\Models\LeadTask;
use Illuminate\Notifications\Notification;

class TaskAssignedNotification extends Notification
{
    public function __construct(public LeadTask $task, public ?string $assignedByName) {}

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
            'lead_id' => $this->task->lead_id,
            'task_id' => $this->task->id,
            'name' => $this->task->title,
            'assigned_by' => $this->assignedByName,
        ];
    }
}
