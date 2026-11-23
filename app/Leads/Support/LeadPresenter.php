<?php

namespace App\Leads\Support;

use App\Leads\Enums\ConsentType;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Enums\MessageChannel;
use App\Leads\Enums\MessageDirection;
use App\Leads\Models\Deal;
use App\Leads\Models\DealStatusLog;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadConsentEvent;
use App\Leads\Models\LeadCustomFieldDefinition;
use App\Leads\Models\LeadMessage;
use App\Leads\Models\LeadSetting;
use App\Leads\Models\LeadTag;
use App\Leads\Models\LeadTask;
use App\Leads\Models\LeadTaskStatusLog;
use App\Leads\Models\MessengerMessageTemplate;
use App\Leads\Models\WhatsAppMessageTemplate;
use App\Leads\Services\LeadAccess;
use App\Leads\Services\LeadPeople;
use App\Leads\Services\Messaging\OutboundEligibility;
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
            'tags' => $lead->tags->toBase()->map(fn (LeadTag $t): array => ['id' => $t->id, 'name' => $t->name, 'color' => $t->color])->values()->all(),
            'created_at' => $lead->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(Lead $lead, Admin $viewer): array
    {
        $lead->loadMissing(['source', 'status', 'estimatedBudgetCurrency', 'dealValueCurrency', 'tags']);
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
            'subject' => $lead->source_data['subject'] ?? null,
            'html_body' => $lead->html_body,
            'conversation' => $this->conversation($lead),
            'messaging' => $this->messaging($lead),
            'sent_messages' => $this->sentMessages($lead),
            'consents' => $this->consents($lead),
            'can_delete_conversation' => $this->access->canDelete($viewer) && $lead->conversations()->exists(),
            'pipeline' => $this->pipeline($lead, $viewer, $settings),
        ];
    }

    /**
     * Tags, deals, tasks and custom fields for the lead page.
     *
     * @return array<string, mixed>
     */
    private function pipeline(Lead $lead, Admin $viewer, LeadSetting $settings): array
    {
        $deals = $lead->deals()->with('currency')->latest()->get();
        $tasks = $lead->tasks()->with('deal')->orderByRaw("case when status = 'pending' then 0 else 1 end")->orderByRaw('due_date is null')->orderBy('due_date')->latest()->get();
        $names = $this->people->namesFor($tasks->pluck('assigned_to'));
        $isManager = $this->access->canDelete($viewer);
        $values = $lead->customFieldValues()->pluck('value', 'lead_custom_field_definition_id');

        return [
            'all_tags' => LeadTag::query()->orderBy('name')->get(['id', 'name', 'color']),
            'deals' => $deals->toBase()->map(fn (Deal $d): array => [
                'id' => $d->id,
                'name' => $d->name,
                'value' => $d->value,
                'currency_id' => $d->currency_id,
                'currency' => $d->currency?->code,
                'probability' => $d->probability,
                'status' => $d->status->value,
                'expected_close_date' => $d->expected_close_date?->toDateString(),
                'actual_close_date' => $d->actual_close_date?->toDateString(),
                'owner_id' => $d->owner_id,
                'owner_name' => $d->owner_name,
                'notes' => $d->notes,
            ])->values()->all(),
            'tasks' => $tasks->toBase()->map(fn (LeadTask $t): array => [
                'id' => $t->id,
                'title' => $t->title,
                'description' => $t->description,
                'deal_id' => $t->deal_id,
                'deal_name' => $t->deal?->name,
                'due_date' => $t->due_date?->toDateString(),
                'due_time' => $t->due_time !== null ? substr($t->due_time, 0, 5) : null,
                'priority' => $t->priority->value,
                'status' => $t->status->value,
                'assigned_to' => $t->assigned_to,
                'assigned_to_name' => $t->assigned_to !== null ? ($names[$t->assigned_to] ?? 'Deleted admin') : null,
                'alert' => $t->alertActive($settings->task_alert_enabled, $settings->task_alert_days_before),
                'can_delete' => $isManager || ($t->assigned_to !== null && $t->assigned_to === (int) $viewer->id),
            ])->values()->all(),
            'custom_fields' => LeadCustomFieldDefinition::query()->activeOrdered()->get()->toBase()->map(fn (LeadCustomFieldDefinition $d): array => [
                'id' => $d->id,
                'name' => $d->name,
                'type' => $d->type->value,
                'options' => $d->options ?? [],
                'is_required' => $d->is_required,
                'value' => $values[$d->id] ?? null,
            ])->values()->all(),
            'people' => $this->people->assignableOptions(),
            'can_delete_deals' => $isManager,
        ];
    }

    /**
     * Whether a reply / template can be sent right now, and the templates
     * available for this lead's channel.
     *
     * @return array<string, mixed>|null
     */
    private function messaging(Lead $lead): ?array
    {
        $channel = $lead->messagingChannel();

        if ($channel === null) {
            return null;
        }

        $conversation = $lead->activeConversation();
        $eligibility = app(OutboundEligibility::class);
        $reply = $conversation !== null ? $eligibility->forReply($conversation) : null;
        $template = $conversation !== null && $channel->supportsTemplates() ? $eligibility->forTemplate($conversation) : null;
        $canReply = $reply !== null && $reply->eligible;
        $canTemplate = $template !== null && $template->eligible;

        $templates = match ($channel) {
            MessageChannel::Whatsapp => WhatsAppMessageTemplate::query()->where('lead_source_id', $lead->source_id)->where('is_active', true)->orderBy('name')->get(),
            MessageChannel::Messenger => MessengerMessageTemplate::query()->where('lead_source_id', $lead->source_id)->where('is_active', true)->get(),
            MessageChannel::Instagram => collect(),
        };

        return [
            'channel' => $channel->value,
            'channel_label' => $channel->label(),
            'has_conversation' => $conversation !== null,
            'can_reply' => $canReply,
            'reply_blocked_reason' => $conversation === null ? 'There is no conversation with this lead yet.' : $reply?->reason,
            'window_closes_at' => $conversation?->last_inbound_at?->copy()->addHours($channel->windowHours())->toIso8601String(),
            'supports_templates' => $channel->supportsTemplates(),
            'can_send_template' => $canTemplate,
            'template_blocked_reason' => $template?->reason,
            'caption_supported' => $channel->supportsMediaCaption(),
            'image_types' => $channel->imageMimeTypes(),
            'image_max_mb' => intdiv($channel->imageMaxBytes(), 1024 * 1024),
            'document_max_mb' => intdiv($channel->documentMaxBytes(), 1024 * 1024),
            'templates' => $templates->map(fn ($t): array => [
                'id' => $t->id,
                'name' => $t->name,
                'language' => $t->language,
                'variable_count' => $t->variable_count,
                'body_text' => $t instanceof MessengerMessageTemplate ? $t->body_text : null,
            ])->values()->all(),
        ];
    }

    /**
     * Messages staff sent (not hidden), newest first.
     *
     * @return array<int, array<string, mixed>>
     */
    private function sentMessages(Lead $lead): array
    {
        return $lead->messages()
            ->where('direction', MessageDirection::Outbound)
            ->whereNull('activity_log_hidden_at')
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (LeadMessage $m): array => [
                'id' => $m->id,
                'type' => $m->message_type->value,
                'body' => $m->body,
                'template_name' => $m->template_name,
                'template_variables' => $m->template_variables,
                'attachment_name' => $m->attachment_name,
                'attachment_url' => $m->attachment_path !== null ? route('admin.leads.messages.attachment', $m, absolute: false) : null,
                'status' => $m->status?->value,
                'failure_reason' => $m->failure_reason,
                'resent' => $m->resend_message_id !== null,
                'sent_by_name' => $m->sent_by_name,
                'at' => $m->created_at?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * Current consent per type plus the full history.
     *
     * @return array{current: array<string, array<string, mixed>|null>, history: array<int, array<string, mixed>>}
     */
    private function consents(Lead $lead): array
    {
        $current = [];

        foreach (ConsentType::cases() as $type) {
            $consent = $lead->consents()->where('consent_type', $type)->first();
            $current[$type->value] = $consent === null ? null : [
                'status' => $consent->status->value,
                'source' => $consent->source->label(),
                'occurred_at' => $consent->occurred_at->toIso8601String(),
            ];
        }

        return [
            'current' => $current,
            'history' => $lead->consentEvents()->latest('occurred_at')->latest('id')->get()->toBase()->map(fn (LeadConsentEvent $e): array => [
                'type' => $e->consent_type->value,
                'type_label' => $e->consent_type->label(),
                'status' => $e->status->value,
                'source' => $e->source->label(),
                'by' => $e->changed_by_name,
                'policy_version' => $e->policy_version,
                'policy_url' => $e->policy_url,
                'ip_address' => $e->ip_address,
                'occurred_at' => $e->occurred_at->toIso8601String(),
            ])->all(),
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
                'status' => $message->status?->value,
                'failure_reason' => $message->failure_reason,
                'message_type' => $message->message_type->value,
                'template_name' => $message->template_name,
                'attachment_name' => $message->attachment_name,
                'attachment_mime' => $message->attachment_mime,
                'attachment_url' => $message->attachment_path !== null ? route('admin.leads.messages.attachment', $message, absolute: false) : null,
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

        $dealIds = $lead->deals()->pluck('name', 'id');

        foreach (DealStatusLog::query()->whereIn('deal_id', $dealIds->keys())->get() as $log) {
            $events[] = [
                'type' => 'deal_status',
                'created_at' => $log->created_at,
                'user' => $log->changed_by_name,
                'name' => $dealIds[$log->deal_id] ?? '',
                'old_status' => $log->old_status?->label(),
                'new_status' => $log->new_status->label(),
            ];
        }

        $taskIds = $lead->tasks()->pluck('title', 'id');

        foreach (LeadTaskStatusLog::query()->whereIn('lead_task_id', $taskIds->keys())->get() as $log) {
            $events[] = [
                'type' => 'task_status',
                'created_at' => $log->created_at,
                'user' => $log->changed_by_name,
                'name' => $taskIds[$log->lead_task_id] ?? '',
                'old_status' => $log->old_status?->label(),
                'new_status' => $log->new_status->label(),
            ];
        }

        usort($events, fn (array $a, array $b): int => $b['created_at'] <=> $a['created_at']);

        return array_map(function (array $event): array {
            $event['created_at'] = $event['created_at']?->toIso8601String();

            return $event;
        }, $events);
    }
}
