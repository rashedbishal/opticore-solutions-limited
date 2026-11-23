<?php

namespace App\Leads\Support;

use App\Leads\Models\Lead;
use App\Leads\Notifications\FollowUpAlertNotification;
use App\Leads\Notifications\FollowUpCancelledNotification;
use App\Leads\Notifications\FollowUpUpdatedNotification;
use App\Leads\Notifications\InboxCannotConnectNotification;
use App\Leads\Notifications\LeadAssignedNotification;
use App\Leads\Notifications\LeadInactivityAlertNotification;
use App\Leads\Notifications\MeetingAlertNotification;
use App\Leads\Notifications\MeetingCancelledNotification;
use App\Leads\Notifications\MeetingUpdatedNotification;
use App\Leads\Notifications\MissedCallNotification;
use App\Leads\Notifications\NewLeadNotification;
use App\Leads\Notifications\TaskAlertNotification;
use App\Leads\Notifications\TaskAssignedNotification;
use App\Leads\Services\LeadAccess;
use App\Models\Admin;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Carbon;

/**
 * Turns a stored lead alert into the bell's title, message and link —
 * worded the same as OptiFin. The link is worked out at read time and only
 * offered while the viewer can still open that lead.
 */
class LeadNotificationPresenter
{
    public function __construct(private readonly LeadAccess $access) {}

    /**
     * @return array{title: string, message: string, url: string|null}
     */
    public function present(DatabaseNotification $notification, Admin $viewer): array
    {
        $data = $notification->data;

        [$title, $message] = match ($notification->type) {
            NewLeadNotification::class => [
                'New lead received',
                sprintf('%s via %s', $data['name'] ?? 'Unknown', $data['source_name'] ?? ''),
            ],
            LeadAssignedNotification::class => [
                ($data['assigned_by'] ?? null) !== null
                    ? sprintf('%s assigned you a lead', $data['assigned_by'])
                    : 'A lead was assigned to you',
                (string) ($data['name'] ?? ''),
            ],
            MeetingAlertNotification::class => ['Meeting reminder', $this->reminder($data, 'meeting_date')],
            FollowUpAlertNotification::class => ['Follow-up reminder', $this->reminder($data, 'next_follow_up_at')],
            MeetingCancelledNotification::class => [
                'Meeting cancelled',
                sprintf('%s cancelled the meeting for %s', $data['cancelled_by'] ?? 'Someone', $data['name'] ?? ''),
            ],
            FollowUpCancelledNotification::class => [
                'Follow-up cancelled',
                sprintf('%s cancelled the follow-up for %s', $data['cancelled_by'] ?? 'Someone', $data['name'] ?? ''),
            ],
            MeetingUpdatedNotification::class => [
                ($data['rescheduled'] ?? false) ? 'Meeting rescheduled' : 'Meeting scheduled',
                $this->dateChange($data, 'meeting_date', 'meeting_time'),
            ],
            FollowUpUpdatedNotification::class => [
                ($data['rescheduled'] ?? false) ? 'Follow-up rescheduled' : 'Follow-up scheduled',
                $this->dateChange($data, 'next_follow_up_at'),
            ],
            TaskAssignedNotification::class => [
                ($data['assigned_by'] ?? null) !== null
                    ? sprintf('%s assigned you a task', $data['assigned_by'])
                    : 'A task was assigned to you',
                (string) ($data['name'] ?? ''),
            ],
            MissedCallNotification::class => [
                'Missed WhatsApp call',
                trim(sprintf('%s %s', (string) ($data['name'] ?? ''), isset($data['reason']) ? '— '.$data['reason'] : '')),
            ],
            LeadInactivityAlertNotification::class => [
                'Lead needs attention',
                sprintf('%s — no status change for %d days', (string) ($data['name'] ?? ''), (int) ($data['days_inactive'] ?? 0)),
            ],
            TaskAlertNotification::class => ['Task reminder', $this->reminder($data, 'due_date')],
            InboxCannotConnectNotification::class => [
                'Email inbox can\'t connect',
                sprintf('%s failed to connect %d times in a row', $data['source_name'] ?? 'An inbox', (int) ($data['failures'] ?? 0)),
            ],
            default => [(string) ($data['title'] ?? 'Notification'), (string) ($data['message'] ?? '')],
        };

        return ['title' => $title, 'message' => $message, 'url' => $this->url($data, $viewer)];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function url(array $data, Admin $viewer): ?string
    {
        if (isset($data['lead_source_id'])) {
            return route('admin.leads.sources.index', absolute: false);
        }

        if (isset($data['lead_id'])) {
            $lead = Lead::query()->find($data['lead_id']);

            return $lead !== null && $this->access->canView($viewer, $lead)
                ? route('admin.leads.show', $lead, absolute: false)
                : null;
        }

        return isset($data['url']) && is_string($data['url']) ? $data['url'] : null;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function reminder(array $data, string $dateKey): string
    {
        $name = $data['name'] ?? 'This lead';
        $date = $data[$dateKey] ?? null;

        return is_string($date) && $date !== ''
            ? sprintf('%s — %s', $name, Carbon::parse($date)->format('M j, Y'))
            : (string) $name;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function dateChange(array $data, string $dateKey, ?string $timeKey = null): string
    {
        $changedBy = $data['changed_by'] ?? 'Someone';
        $name = $data['name'] ?? 'a lead';
        $date = $data[$dateKey] ?? null;

        if (! is_string($date) || $date === '') {
            return sprintf('%s updated %s', $changedBy, $name);
        }

        $formatted = Carbon::parse($date)->format('M j, Y');
        $time = $timeKey !== null ? ($data[$timeKey] ?? null) : null;

        return is_string($time) && $time !== ''
            ? sprintf('%s set %s to %s at %s', $changedBy, $name, $formatted, $time)
            : sprintf('%s set %s to %s', $changedBy, $name, $formatted);
    }
}
