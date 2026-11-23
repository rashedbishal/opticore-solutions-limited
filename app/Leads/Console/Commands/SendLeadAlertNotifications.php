<?php

namespace App\Leads\Console\Commands;

use App\Leads\Models\Lead;
use App\Leads\Models\LeadSetting;
use App\Leads\Notifications\FollowUpAlertNotification;
use App\Leads\Notifications\LeadNotification;
use App\Leads\Notifications\MeetingAlertNotification;
use App\Leads\Services\LeadPeople;
use App\Leads\Support\LeadClock;
use App\Models\Admin;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

/**
 * Daily 08:00 (Bangladesh time) sweep: one bell alert per lead, per recipient, per day, for
 * as long as that lead's meeting or follow-up reminder is showing.
 * Recipients are every manager plus the lead's owner.
 */
class SendLeadAlertNotifications extends Command
{
    protected $signature = 'leads:send-alert-notifications';

    protected $description = 'Send bell alerts for leads whose meeting or follow-up reminder is showing today';

    public function handle(LeadPeople $people): int
    {
        $settings = LeadSetting::current();

        if (! $settings->meeting_alert_enabled && ! $settings->followup_alert_enabled) {
            return self::SUCCESS;
        }

        $managers = $people->managers();

        if ($settings->meeting_alert_enabled) {
            $this->sweep('meeting_date', fn (Lead $lead) => $lead->meetingAlertActive(true, $settings->meeting_alert_days_before), MeetingAlertNotification::class, $managers, $people);
        }

        if ($settings->followup_alert_enabled) {
            $this->sweep('next_follow_up_at', fn (Lead $lead) => $lead->followUpAlertActive(true, $settings->followup_alert_days_before), FollowUpAlertNotification::class, $managers, $people);
        }

        return self::SUCCESS;
    }

    /**
     * @param  callable(Lead): bool  $isActive
     * @param  class-string<LeadNotification>  $notificationClass
     * @param  Collection<int, Admin>  $managers
     */
    private function sweep(string $dateColumn, callable $isActive, string $notificationClass, Collection $managers, LeadPeople $people): void
    {
        Lead::query()->whereNotNull($dateColumn)->chunkById(200, function (Collection $leads) use ($isActive, $notificationClass, $managers, $people): void {
            foreach ($leads as $lead) {
                if (! $isActive($lead)) {
                    continue;
                }

                $recipients = $managers->toBase();

                if ($lead->assigned_to !== null && ! $recipients->contains(fn (Admin $admin) => (int) $admin->id === $lead->assigned_to)) {
                    $owner = $people->findLeadUser($lead->assigned_to);

                    if ($owner !== null) {
                        $recipients->push($owner);
                    }
                }

                foreach ($recipients as $recipient) {
                    if (! $this->alreadyNotifiedToday($recipient, $notificationClass, $lead)) {
                        $recipient->notify(new $notificationClass($lead));
                    }
                }
            }
        });
    }

    private function alreadyNotifiedToday(Admin $recipient, string $notificationClass, Lead $lead): bool
    {
        [$start, $end] = LeadClock::todayRangeUtc();

        return $recipient->notifications()
            ->where('type', $notificationClass)
            ->where('data', 'like', '%"lead_id":"'.$lead->id.'"%')
            ->where('created_at', '>=', $start)
            ->where('created_at', '<', $end)
            ->exists();
    }
}
