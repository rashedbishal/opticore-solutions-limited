<?php

namespace App\Leads\Console\Commands;

use App\Leads\Enums\TaskStatus;
use App\Leads\Models\LeadSetting;
use App\Leads\Models\LeadTask;
use App\Leads\Notifications\TaskAlertNotification;
use App\Leads\Services\LeadPeople;
use App\Leads\Support\LeadClock;
use App\Models\Admin;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

/**
 * Daily 08:00 (Bangladesh time): one bell alert per task, per recipient,
 * per day while its reminder is showing. Recipients are every manager plus
 * the task's own assignee (same as OptiFin).
 */
class SendTaskAlertNotifications extends Command
{
    protected $signature = 'tasks:send-alert-notifications';

    protected $description = 'Send bell alerts for lead tasks whose due-date reminder is showing today';

    public function handle(LeadPeople $people): int
    {
        $settings = LeadSetting::current();

        if (! $settings->task_alert_enabled) {
            return self::SUCCESS;
        }

        $managers = $people->managers();
        [$start, $end] = LeadClock::todayRangeUtc();

        LeadTask::query()->where('status', TaskStatus::Pending)->whereNotNull('due_date')->chunkById(200, function (Collection $tasks) use ($settings, $managers, $people, $start, $end): void {
            foreach ($tasks as $task) {
                if (! $task->alertActive(true, $settings->task_alert_days_before)) {
                    continue;
                }

                $recipients = $managers->toBase();

                if ($task->assigned_to !== null && ! $recipients->contains(fn (Admin $a) => (int) $a->id === $task->assigned_to)) {
                    $assignee = $people->findLeadUser($task->assigned_to);

                    if ($assignee !== null) {
                        $recipients->push($assignee);
                    }
                }

                foreach ($recipients as $recipient) {
                    $already = $recipient->notifications()
                        ->where('type', TaskAlertNotification::class)
                        ->where('data', 'like', '%"task_id":"'.$task->id.'"%')
                        ->where('created_at', '>=', $start)
                        ->where('created_at', '<', $end)
                        ->exists();

                    if (! $already) {
                        $recipient->notify(new TaskAlertNotification($task));
                    }
                }
            }
        });

        return self::SUCCESS;
    }
}
