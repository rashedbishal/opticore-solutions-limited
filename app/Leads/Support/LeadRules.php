<?php

namespace App\Leads\Support;

use App\Leads\Enums\LeadPriority;
use Illuminate\Validation\Rule;

/**
 * Validation for lead fields — the same rules and messages as OptiFin, so a
 * value accepted there is accepted here. Dates use Bangladesh "today".
 */
final class LeadRules
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public static function contact(bool $phoneRequired = false): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:255', 'regex:/^[\p{L}\p{M}][\p{L}\p{M}\s\'.-]*$/u'],
            'phone' => [$phoneRequired ? 'required' : 'nullable', 'regex:/^(?=(?:\D*\d){7,})[0-9+\-\s()]{7,20}$/'],
            'email' => ['nullable', 'email', 'max:255'],
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public static function company(): array
    {
        return [
            'company' => ['nullable', 'string', 'max:255', 'regex:/^[\p{L}\p{N}][\p{L}\p{N}\s.,&\'()-]*$/u'],
            'website' => ['nullable', 'url', 'max:255', 'regex:#^https?://#i'],
            'industry' => ['nullable', 'string', 'max:255', 'regex:#^[\p{L}][\p{L}\s&,/-]*$#u'],
            'location' => ['nullable', 'string', 'max:255', 'regex:/^[\p{L}][\p{L}\s,.-]*$/u'],
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public static function deal(): array
    {
        $today = LeadClock::todayString();

        return [
            'service_interest' => ['nullable', 'string', 'max:255', 'regex:#^[\p{L}\p{N}][\p{L}\p{N}\s&,./()-]*$#u'],
            'lead_source' => ['nullable', 'string', 'max:255', 'regex:#^[\p{L}\p{N}][\p{L}\p{N}\s&,./()-]*$#u'],
            'estimated_budget' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99', 'regex:/^\d{1,12}(\.\d{1,2})?$/'],
            'estimated_budget_currency_id' => ['nullable', 'string', Rule::exists('currencies', 'id')],
            'deal_value' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99', 'regex:/^\d{1,12}(\.\d{1,2})?$/'],
            'deal_value_currency_id' => ['nullable', 'string', Rule::exists('currencies', 'id')],
            'win_probability' => ['nullable', 'integer', 'min:0', 'max:100'],
            'next_follow_up_at' => ['nullable', 'date', 'after_or_equal:'.$today],
            'meeting_at' => ['nullable', 'date_format:Y-m-d\TH:i', 'after_or_equal:'.$today],
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public static function create(): array
    {
        return [
            ...self::contact(phoneRequired: true),
            ...self::company(),
            ...self::deal(),
            'message' => ['nullable', 'string', 'max:2000'],
            'status_id' => ['required', 'string', Rule::exists('lead_statuses', 'id')],
            'priority' => ['required', Rule::enum(LeadPriority::class)],
            'assigned_to' => ['nullable', 'integer'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'name.regex' => 'Contact person may only contain letters, spaces, apostrophes, periods and hyphens.',
            'company.regex' => 'Company name contains characters that are not allowed.',
            'website.regex' => 'Website URL must start with http:// or https://.',
            'industry.regex' => 'Industry sector contains characters that are not allowed.',
            'location.regex' => 'Location contains characters that are not allowed.',
            'service_interest.regex' => 'Service interested contains characters that are not allowed.',
            'lead_source.regex' => 'Lead source contains characters that are not allowed.',
            'phone.regex' => 'Enter a valid phone number (at least 7 digits).',
            'estimated_budget.regex' => 'Enter a plain amount with up to 2 decimal places.',
            'deal_value.regex' => 'Enter a plain amount with up to 2 decimal places.',
            'next_follow_up_at.after_or_equal' => 'Next follow-up date cannot be in the past.',
            'meeting_at.after_or_equal' => 'Meeting date cannot be in the past.',
        ];
    }

    /**
     * Turns validated deal fields into lead columns: splits the meeting
     * date-time, and drops a currency whose amount is empty (a currency
     * without an amount means nothing).
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public static function dealColumns(array $validated, bool $includeLeadSourceText): array
    {
        [$meetingDate, $meetingTime] = ! empty($validated['meeting_at'])
            ? explode('T', (string) $validated['meeting_at'])
            : [null, null];

        $columns = [
            'service_interest' => ($validated['service_interest'] ?? null) ?: null,
            'estimated_budget' => ($validated['estimated_budget'] ?? null) ?: null,
            'estimated_budget_currency_id' => ! empty($validated['estimated_budget']) ? (($validated['estimated_budget_currency_id'] ?? null) ?: null) : null,
            'deal_value' => ($validated['deal_value'] ?? null) ?: null,
            'deal_value_currency_id' => ! empty($validated['deal_value']) ? (($validated['deal_value_currency_id'] ?? null) ?: null) : null,
            'win_probability' => ($validated['win_probability'] ?? null) ?: null,
            'next_follow_up_at' => ($validated['next_follow_up_at'] ?? null) ?: null,
            'meeting_date' => $meetingDate,
            'meeting_time' => $meetingTime,
        ];

        if ($includeLeadSourceText) {
            $columns['lead_source'] = ($validated['lead_source'] ?? null) ?: null;
        }

        return $columns;
    }
}
