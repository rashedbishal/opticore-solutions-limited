<?php

namespace App\Leads\Services;

use App\Leads\Enums\ConsentSource;
use App\Leads\Enums\ConsentStatus;
use App\Leads\Enums\ConsentType;
use App\Leads\Enums\LeadDuplicateLinkStatus;
use App\Leads\Exceptions\LeadMergeException;
use App\Leads\Models\Currency;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadConsent;
use App\Leads\Models\LeadConsentEvent;
use App\Leads\Models\LeadCustomFieldDefinition;
use App\Leads\Models\LeadCustomFieldValue;
use App\Leads\Models\LeadDetailUpdateLog;
use App\Leads\Models\LeadDuplicateLink;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;

/**
 * Merges a duplicate ("loser") into the lead being kept ("survivor") in one
 * transaction, as OptiFin does: everything the loser has moves over, only
 * the values a manager picked replace the survivor's, and the loser is
 * hidden (pointing at the survivor), never deleted.
 *
 * Unlike OptiFin, a money amount and its currency are chosen together.
 */
class LeadMerger
{
    /**
     * Choices offered when the two leads differ. A money amount carries
     * its currency with it.
     *
     * @var array<string, array{label: string, columns: array<int, string>}>
     */
    public const array CHOICES = [
        'name' => ['label' => 'Name', 'columns' => ['name']],
        'email' => ['label' => 'Email', 'columns' => ['email']],
        'phone' => ['label' => 'Phone', 'columns' => ['phone']],
        'company' => ['label' => 'Company', 'columns' => ['company']],
        'website' => ['label' => 'Website', 'columns' => ['website']],
        'industry' => ['label' => 'Industry', 'columns' => ['industry']],
        'location' => ['label' => 'Location', 'columns' => ['location']],
        'service_interest' => ['label' => 'Service interest', 'columns' => ['service_interest']],
        'estimated_budget' => ['label' => 'Estimated budget', 'columns' => ['estimated_budget', 'estimated_budget_currency_id']],
        'deal_value' => ['label' => 'Deal value', 'columns' => ['deal_value', 'deal_value_currency_id']],
        'win_probability' => ['label' => 'Win probability', 'columns' => ['win_probability']],
    ];

    /**
     * Tables whose rows simply move to the kept lead.
     *
     * @var array<int, string>
     */
    private const array CHILD_TABLES = [
        'lead_notes', 'lead_attachments', 'lead_status_logs', 'lead_assignments', 'lead_detail_update_logs',
        'lead_tasks', 'deals', 'lead_consent_events', 'lead_conversations', 'lead_messages', 'lead_conversation_deletions',
    ];

    /**
     * Where the loser has a value that differs from the survivor's, keyed by
     * choice (both built-in fields and "cf:{id}" custom fields).
     *
     * @return array<string, array{label: string, survivor: string, loser: string}>
     */
    public function conflicts(Lead $survivor, Lead $loser): array
    {
        $conflicts = [];

        foreach (self::CHOICES as $key => $choice) {
            $first = $choice['columns'][0];
            $loserValue = $loser->getAttribute($first);

            if ($loserValue === null || $loserValue === '') {
                continue;
            }

            $same = true;

            foreach ($choice['columns'] as $column) {
                if ((string) $loser->getAttribute($column) !== (string) $survivor->getAttribute($column)) {
                    $same = false;
                }
            }

            if (! $same) {
                $conflicts[$key] = [
                    'label' => $choice['label'],
                    'survivor' => $this->display($survivor, $choice['columns']),
                    'loser' => $this->display($loser, $choice['columns']),
                ];
            }
        }

        $survivorValues = $survivor->customFieldValues()->pluck('value', 'lead_custom_field_definition_id');
        $loserValues = $loser->customFieldValues()->pluck('value', 'lead_custom_field_definition_id');
        $names = LeadCustomFieldDefinition::query()->pluck('name', 'id');

        foreach ($loserValues as $definitionId => $value) {
            if (isset($survivorValues[$definitionId]) && $survivorValues[$definitionId] !== $value) {
                $conflicts["cf:{$definitionId}"] = [
                    'label' => (string) ($names[$definitionId] ?? 'Custom field'),
                    'survivor' => (string) $survivorValues[$definitionId],
                    'loser' => (string) $value,
                ];
            }
        }

        return $conflicts;
    }

    /**
     * @param  array<string, string>  $choices  choice key => 'survivor'|'loser'
     */
    public function merge(Lead $survivor, Lead $loser, Admin $by, array $choices, ?LeadDuplicateLink $link = null): Lead
    {
        if ($survivor->id === $loser->id) {
            throw new LeadMergeException('A lead cannot be merged with itself.');
        }

        if ($link !== null && ! ($link->involves($survivor) && $link->involves($loser))) {
            throw new LeadMergeException('This duplicate pair does not belong to these two leads.');
        }

        return DB::transaction(function () use ($survivor, $loser, $by, $choices, $link): Lead {
            $locked = Lead::query()->withMerged()->whereKey([$survivor->id, $loser->id])->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $survivor = $locked->get($survivor->id);
            $loser = $locked->get($loser->id);

            if ($survivor === null || $loser === null || $survivor->isMerged() || $loser->isMerged()) {
                throw new LeadMergeException('One of these leads has already been merged or deleted.');
            }

            $conflicts = $this->conflicts($survivor, $loser);
            $snapshot = [];
            $updates = [];

            foreach ($conflicts as $key => $values) {
                $chosen = ($choices[$key] ?? 'survivor') === 'loser' ? 'loser' : 'survivor';
                $snapshot[$key] = ['chosen' => $chosen, 'survivor_value' => $values['survivor'], 'loser_value' => $values['loser']];

                if ($chosen === 'loser' && isset(self::CHOICES[$key])) {
                    foreach (self::CHOICES[$key]['columns'] as $column) {
                        $updates[$column] = $loser->getAttribute($column);
                    }
                }
            }

            // Fill survivor blanks from the loser (no choice needed).
            foreach (self::CHOICES as $choice) {
                $first = $choice['columns'][0];

                if (($survivor->getAttribute($first) === null || $survivor->getAttribute($first) === '') && $loser->getAttribute($first) !== null && $loser->getAttribute($first) !== '') {
                    foreach ($choice['columns'] as $column) {
                        $updates[$column] = $loser->getAttribute($column);
                    }
                }
            }

            foreach (self::CHILD_TABLES as $table) {
                DB::table($table)->where('lead_id', $loser->id)->update(['lead_id' => $survivor->id]);
            }

            $this->mergeTags($survivor, $loser);
            $this->mergeCustomFields($survivor, $loser, $conflicts, $choices);
            $this->mergeConsents($survivor, $loser, $by);

            if ($updates !== []) {
                $survivor->fill($updates)->save();
            }

            DB::table('leads')->where('id', $loser->id)->update([
                'merged_into_lead_id' => $survivor->id,
                'merged_at' => now(),
                'updated_at' => now(),
            ]);

            $link ??= LeadDuplicateLink::query()->firstOrCreate(
                array_combine(['lead_id', 'duplicate_lead_id'], LeadDuplicateLink::pairKeys($survivor, $loser)),
                ['status' => LeadDuplicateLinkStatus::Pending, 'matched_fields' => [], 'detected_at' => now()],
            );

            $link->update([
                'status' => LeadDuplicateLinkStatus::Merged,
                'resolved_by' => $by->id,
                'resolved_by_name' => $by->name,
                'resolved_at' => now(),
                'field_resolutions' => $snapshot,
            ]);

            LeadDetailUpdateLog::create([
                'lead_id' => $survivor->id,
                'changed_by' => $by->id,
                'changed_by_name' => $by->name,
                'changed_fields' => [$loser->identifier],
                'action' => 'merged',
            ]);

            return $survivor->fresh() ?? $survivor;
        });
    }

    private function mergeTags(Lead $survivor, Lead $loser): void
    {
        $existing = DB::table('lead_lead_tag')->where('lead_id', $survivor->id)->pluck('lead_tag_id')->all();

        foreach (DB::table('lead_lead_tag')->where('lead_id', $loser->id)->get(['lead_tag_id', 'tagged_by']) as $row) {
            if (! in_array($row->lead_tag_id, $existing, true)) {
                $survivor->tags()->attach($row->lead_tag_id, ['tagged_by' => $row->tagged_by]);
            }
        }

        DB::table('lead_lead_tag')->where('lead_id', $loser->id)->delete();
    }

    /**
     * Loser values fill the survivor's blanks; a picked loser value replaces
     * the survivor's. The loser keeps none.
     *
     * @param  array<string, array{label: string, survivor: string, loser: string}>  $conflicts
     * @param  array<string, string>  $choices
     */
    private function mergeCustomFields(Lead $survivor, Lead $loser, array $conflicts, array $choices): void
    {
        $survivorValues = LeadCustomFieldValue::query()->where('lead_id', $survivor->id)->get()->keyBy('lead_custom_field_definition_id');

        foreach (LeadCustomFieldValue::query()->where('lead_id', $loser->id)->get() as $value) {
            $definitionId = $value->getAttribute('lead_custom_field_definition_id');
            $own = $survivorValues->get($definitionId);

            if ($own === null) {
                $value->update(['lead_id' => $survivor->id]);

                continue;
            }

            if (isset($conflicts["cf:{$definitionId}"]) && ($choices["cf:{$definitionId}"] ?? 'survivor') === 'loser') {
                $own->update(['value' => $value->getAttribute('value')]);
            }

            $value->delete();
        }
    }

    /**
     * Withdrawn always wins; nothing is silently downgraded. The loser's own
     * consent rows stay with it (hidden); history moved with CHILD_TABLES.
     */
    private function mergeConsents(Lead $survivor, Lead $loser, Admin $by): void
    {
        $mine = LeadConsent::query()->where('lead_id', $survivor->id)->get()->keyBy(fn (LeadConsent $c): string => $c->consent_type->value);
        $theirs = LeadConsent::query()->where('lead_id', $loser->id)->get()->keyBy(fn (LeadConsent $c): string => $c->consent_type->value);

        foreach (ConsentType::cases() as $type) {
            $a = $mine->get($type->value);
            $b = $theirs->get($type->value);

            if ($b === null) {
                continue;
            }

            $status = ($a?->status === ConsentStatus::Withdrawn || $b->status === ConsentStatus::Withdrawn)
                ? ConsentStatus::Withdrawn
                : ConsentStatus::Granted;

            if ($a !== null && $a->status === $status) {
                continue;
            }

            $attributes = [
                'lead_identifier' => $survivor->identifier,
                'lead_name' => $survivor->name,
                'status' => $status,
                'source' => ConsentSource::Merge,
                'changed_by' => $by->id,
                'changed_by_name' => $by->name,
                'policy_version' => null,
                'policy_url' => null,
                'ip_address' => null,
                'user_agent' => null,
                'occurred_at' => now(),
            ];

            LeadConsent::query()->updateOrCreate(['lead_id' => $survivor->id, 'consent_type' => $type], $attributes);
            LeadConsentEvent::create([...$attributes, 'lead_id' => $survivor->id, 'consent_type' => $type]);
        }
    }

    /**
     * @param  array<int, string>  $columns
     */
    private function display(Lead $lead, array $columns): string
    {
        $value = (string) $lead->getAttribute($columns[0]);

        if (isset($columns[1]) && $lead->getAttribute($columns[1]) !== null) {
            $code = Currency::query()->whereKey($lead->getAttribute($columns[1]))->value('code');

            return trim("{$code} {$value}");
        }

        return $value;
    }
}
