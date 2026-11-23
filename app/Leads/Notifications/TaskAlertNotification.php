<?php

namespace App\Leads\Notifications;

use App\Leads\Models\LeadTask;
use Illuminate\Notifications\Notification;

/**
 * Daily 08:00 reminder while a task's due-date reminder is showing.
 */
class TaskAlertNotification extends Notification
{
    public function __construct(public LeadTask $task) {}

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
            'due_date' => $this->task->due_date?->toDateString(),
        ];
    }
}
