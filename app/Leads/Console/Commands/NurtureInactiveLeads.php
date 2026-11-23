<?php

namespace App\Leads\Console\Commands;

use App\Leads\Enums\LeadPriority;
use App\Leads\Enums\LeadScoringField;
use App\Leads\Enums\TaskStatus;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSetting;
use App\Leads\Models\LeadStatus;
use App\Leads\Models\LeadTask;
use App\Leads\Notifications\LeadInactivityAlertNotification;
use App\Leads\Notifications\TaskAssignedNotification;
use App\Leads\Services\LeadPeople;
use App\Leads\Support\LeadClock;
use App\Models\Admin;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Daily 08:00 (Bangladesh time), same as OptiFin: open leads whose status
 * hasn't changed for the set number of days get a bell alert (managers +
 * the lead's person, once a day each) and/or one automatic follow-up task
 * for the lead's person (never a second while one is still pending).
 */
class NurtureInactiveLeads extends Command
{
    protected $signature = 'leads:nurture-inactive-leads';

    protected $description = 'Alert about, and create follow-up tasks for, leads inactive past the set number of days';

    public function handle(LeadPeople $people): int
    {
        $settings = LeadSetting::current();

        if (! $settings->nurturing_notify_enabled && ! $settings->nurturing_task_enabled) {
            return self::SUCCESS;
        }

        $closed = LeadStatus::query()->where('is_closed', true)->pluck('id');
        $managers = $people->managers();

        Lead::query()
            ->when($closed->isNotEmpty(), fn ($q) => $q->whereNotIn('status_id', $closed))
            ->chunkById(200, function (Collection $leads) use ($settings, $managers, $people): void {
                foreach ($leads as $lead) {
                    try {
                        $this->process($lead, $settings, $managers, $people);
                    } catch (Throwable $e) {
                        report($e);
                    }
                }
            });

        return self::SUCCESS;
    }

    /**
     * @param  EloquentCollection<int, Admin>  $managers
     */
    private function process(Lead $lead, LeadSetting $settings, EloquentCollection $managers, LeadPeople $people): void
    {
        $days = LeadScoringField::daysSinceLastStatusChange($lead);

        if ($days === null || $days < $settings->nurturing_inactive_days) {
            return;
        }

        $assignee = $lead->assigned_to !== null ? $people->findLeadUser($lead->assigned_to) : null;

        if ($settings->nurturing_notify_enabled) {
            $recipients = $managers->toBase();

            if ($assignee !== null && ! $recipients->contains(fn (Admin $a) => (int) $a->id === (int) $assignee->id)) {
                $recipients->push($assignee);
            }

            [$start, $end] = LeadClock::todayRangeUtc();

            foreach ($recipients as $recipient) {
                $already = $recipient->notifications()
                    ->where('type', LeadInactivityAlertNotification::class)
                    ->where('data', 'like', '%"lead_id":"'.$lead->id.'"%')
                    ->where('created_at', '>=', $start)
                    ->where('created_at', '<', $end)
                    ->exists();

                if (! $already) {
                    $recipient->notify(new LeadInactivityAlertNotification($lead, $days));
                }
            }
        }

        if ($settings->nurturing_task_enabled) {
            $this->createTask($lead, $days, $assignee);
        }
    }

    private function createTask(Lead $lead, int $days, ?Admin $assignee): void
    {
        $createdAt = $lead->getAttribute('nurturing_task_created_at');

        if ($createdAt !== null && LeadClock::today()->lte($createdAt->copy()->timezone(LeadClock::TIMEZONE)->startOfDay())) {
            return;
        }

        $hasOpenSystemTask = LeadTask::query()->where('lead_id', $lead->id)->where('status', TaskStatus::Pending)->whereNull('created_by')->exists();

        if ($hasOpenSystemTask) {
            return;
        }

        $task = LeadTask::create([
            'lead_id' => $lead->id,
            'status' => TaskStatus::Pending,
            'title' => "Follow up — inactive for {$days} days",
            'due_date' => LeadClock::todayString(),
            'priority' => LeadPriority::Medium,
            'assigned_to' => $assignee?->id,
            'created_by' => null,
        ]);

        DB::table('leads')->where('id', $lead->id)->update(['nurturing_task_created_at' => now()]);

        $assignee?->notify(new TaskAssignedNotification($task, null));
    }
}
