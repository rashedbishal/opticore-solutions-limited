<?php

namespace App\Leads\Support;

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSetting;
use App\Leads\Services\LeadAccess;
use App\Leads\Services\LeadPeople;
use App\Models\Admin;
use Illuminate\Support\Collection;

/**
 * The shapes the lead screens receive: a list row/board card, and the full
 * detail (side panel and full page share it).
 */
class LeadPresenter
{
    /** Labels for the "details updated" history entries (same as OptiFin). */
    public const FIELD_LABELS = [
        'name' => 'Contact Person',
        'phone' => 'Phone',
        'email' => 'Email',
        'company' => 'Company',
        'website' => 'Website',
        'industry' => 'Industry',
        'location' => 'Location',
        'service_interest' => 'Service Interested',
        'lead_source' => 'Lead Source',
        'estimated_budget' => 'Est. Budget',
        'estimated_budget_currency_id' => 'Est. Budget Currency',
        'deal_value' => 'Deal Value',
        'deal_value_currency_id' => 'Deal Value Currency',
        'win_probability' => 'Win Probability',
        'next_follow_up_at' => 'Next Follow-up',
        'meeting_date' => 'Meeting Date',
        'meeting_time' => 'Meeting Time',
        'priority' => 'Priority',
    ];

    public function __construct(
        private readonly LeadAccess $access,
        private readonly LeadPeople $people,
    ) {}

    /**
     * @param  Collection<int, Lead>  $leads
     * @return array<int, array<string, mixed>>
     */
    public function rows(Collection $leads): array
    {
        $names = $this->people->namesFor($leads->pluck('assigned_to'));
        $settings = LeadSetting::current();

        return $leads->map(fn (Lead $lead): array => $this->row($lead, $names, $settings))->values()->all();
    }

    /**
     * @param  array<int, string>  $names
     * @return array<string, mixed>
     */
    private function row(Lead $lead, array $names, LeadSetting $settings): array
    {
        return [
            'id' => $lead->id,
            'identifier' => $lead->identifier,
            'name' => $lead->name,
            'email' => $lead->email,
            'phone' => $lead->phone,
            'company' => $lead->company,
            'status_id' => $lead->status_id,
            'priority' => $lead->priority->value,
            'source' => ['type' => $lead->source->type->value, 'name' => $lead->source->name],
            'assigned_to' => $lead->assigned_to,
            'assigned_to_name' => $lead->assigned_to !== null ? ($names[$lead->assigned_to] ?? 'Deleted admin') : null,
            'meeting_alert' => $lead->meetingAlertActive($settings->meeting_alert_enabled, $settings->meeting_alert_days_before),
            'follow_up_alert' => $lead->followUpAlertActive($settings->followup_alert_enabled, $settings->followup_alert_days_before),
            'has_unseen_update' => $lead->hasUnseenUpdate(),
            'created_at' => $lead->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(Lead $lead, Admin $viewer): array
    {
        $lead->loadMissing(['source', 'status', 'estimatedBudgetCurrency', 'dealValueCurrency']);
        $settings = LeadSetting::current();
        $names = $this->people->namesFor([$lead->assigned_to]);

        return [
            ...$this->row($lead, $names, $settings),
            'message' => $lead->message,
            'website' => $lead->website,
            'industry' => $lead->industry,
            'location' => $lead->location,
            'service_interest' => $lead->service_interest,
            'lead_source' => $lead->lead_source,
            'estimated_budget' => $lead->estimated_budget,
            'estimated_budget_currency_id' => $lead->estimated_budget_currency_id,
            'estimated_budget_currency' => $lead->estimatedBudgetCurrency?->code,
            'deal_value' => $lead->deal_value,
            'deal_value_currency_id' => $lead->deal_value_currency_id,
            'deal_value_currency' => $lead->dealValueCurrency?->code,
            'win_probability' => $lead->win_probability,
            'next_follow_up_at' => $lead->next_follow_up_at?->toDateString(),
            'meeting_date' => $lead->meeting_date?->toDateString(),
            'meeting_time' => $lead->meeting_time !== null ? substr($lead->meeting_time, 0, 5) : null,
            'meeting_time_label' => $lead->meetingTimeFormatted(),
            'meeting_due' => $lead->meeting_date !== null && LeadClock::today()->gte($lead->meeting_date),
            'follow_up_due' => $lead->next_follow_up_at !== null && LeadClock::today()->gte($lead->next_follow_up_at),
            'first_contacted_at' => $lead->first_contacted_at?->toIso8601String(),
            'closed_at' => $lead->closed_at?->toIso8601String(),
            'is_manual' => $lead->source->type === LeadSourceType::Manual,
            'can' => [
                'update' => $this->access->canUpdate($viewer, $lead),
                'assign' => $this->access->canAssign($viewer),
                'delete' => $this->access->canDelete($viewer),
            ],
            'activity' => $this->activity($lead),
            'avatar_url' => $lead->source_data['facebook_profile_pic'] ?? $lead->source_data['instagram_profile_pic'] ?? null,
            'conversation' => $this->conversation($lead),
        ];
    }

    /**
     * The chat with this lead across Messenger / Instagram / WhatsApp:
     * messages and attachments in time order, oldest first.
     *
     * @return array<int, array<string, mixed>>
     */
    private function conversation(Lead $lead): array
    {
        $items = [];

        foreach ($lead->messages()->get() as $message) {
            $items[] = [
                'kind' => 'message',
                'id' => $message->id,
                'channel' => $message->channel->value,
                'direction' => $message->direction->value,
                'body' => $message->body,
                'sent_by_name' => $message->sent_by_name,
                'status' => $message->status,
                'at' => $message->created_at,
            ];
        }

        foreach ($lead->attachments()->get() as $attachment) {
            $items[] = [
                'kind' => 'attachment',
                'id' => $attachment->id,
                'type' => $attachment->type,
                'status' => $attachment->status->value,
                'mime' => $attachment->mime,
                'url' => $attachment->status->value === 'downloaded' ? route('admin.leads.attachments.show', $attachment, absolute: false) : null,
                'at' => $attachment->sent_at ?? $attachment->created_at,
            ];
        }

        usort($items, fn (array $a, array $b): int => $a['at'] <=> $b['at']);

        return array_map(function (array $item): array {
            $item['at'] = $item['at']?->toIso8601String();

            return $item;
        }, $items);
    }

    /**
     * Status changes, assignments, notes and edits, newest first.
     *
     * @return array<int, array<string, mixed>>
     */
    private function activity(Lead $lead): array
    {
        $events = [];

        foreach ($lead->statusLogs()->with(['oldStatus', 'newStatus'])->get() as $log) {
            $events[] = [
                'type' => 'status_change',
                'created_at' => $log->created_at,
                'user' => $log->changed_by_name,
                'old_status' => $log->oldStatus?->name,
                'new_status' => $log->newStatus?->name,
                'note' => $log->note,
            ];
        }

        foreach ($lead->assignments()->get() as $assignment) {
            $events[] = [
                'type' => 'assignment',
                'created_at' => $assignment->created_at,
                'user' => $assignment->assigned_by_name,
                'assigned_to' => $assignment->assigned_to_name,
                'note' => $assignment->assignment_note,
            ];
        }

        foreach ($lead->notes()->get() as $note) {
            $events[] = [
                'type' => 'note',
                'created_at' => $note->created_at,
                'user' => $note->admin_name,
                'note' => $note->note,
            ];
        }

        foreach ($lead->detailUpdateLogs()->get() as $log) {
            $events[] = [
                'type' => $log->action ?? 'details_updated',
                'created_at' => $log->created_at,
                'user' => $log->changed_by_name,
                'action_date' => $log->action_date?->toDateString(),
                'fields' => array_map(fn (string $key): string => array_key_exists($key, self::FIELD_LABELS) ? self::FIELD_LABELS[$key] : $key, $log->changed_fields ?? []),
            ];
        }

        usort($events, fn (array $a, array $b): int => $b['created_at'] <=> $a['created_at']);

        return array_map(function (array $event): array {
            $event['created_at'] = $event['created_at']?->toIso8601String();

            return $event;
        }, $events);
    }
}
