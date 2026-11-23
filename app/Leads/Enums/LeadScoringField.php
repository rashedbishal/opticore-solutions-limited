<?php

namespace App\Leads\Enums;

use App\Leads\Models\Lead;
use App\Leads\Models\LeadStatus;
use App\Leads\Models\LeadStatusLog;
use Carbon\CarbonInterface;

/**
 * What a scoring rule can look at (same fields as OptiFin). A rule on a
 * field with no value (e.g. no budget) simply doesn't match.
 */
enum LeadScoringField: string
{
    case Priority = 'priority';
    case SourceType = 'source_type';
    case Status = 'status';
    case EstimatedBudget = 'estimated_budget';
    case DealValue = 'deal_value';
    case WinProbability = 'win_probability';
    case HasEmail = 'has_email';
    case HasPhone = 'has_phone';
    case DaysSinceCreated = 'days_since_created';
    case DaysSinceLastStatusChange = 'days_since_last_status_change';

    public function label(): string
    {
        return match ($this) {
            self::Priority => 'Priority',
            self::SourceType => 'Source channel',
            self::Status => 'Status',
            self::EstimatedBudget => 'Estimated budget',
            self::DealValue => 'Deal value',
            self::WinProbability => 'Win probability (%)',
            self::HasEmail => 'Has an email',
            self::HasPhone => 'Has a phone',
            self::DaysSinceCreated => 'Days since added',
            self::DaysSinceLastStatusChange => 'Days since last status change',
        };
    }

    /** numeric | choice | yes_no */
    public function kind(): string
    {
        return match ($this) {
            self::Priority, self::SourceType, self::Status => 'choice',
            self::HasEmail, self::HasPhone => 'yes_no',
            default => 'numeric',
        };
    }

    /**
     * @return array<int, LeadScoringOperator>
     */
    public function allowedOperators(): array
    {
        return match ($this->kind()) {
            'numeric' => [
                LeadScoringOperator::GreaterThanOrEqual, LeadScoringOperator::LessThanOrEqual,
                LeadScoringOperator::GreaterThan, LeadScoringOperator::LessThan,
                LeadScoringOperator::Equals, LeadScoringOperator::NotEquals,
            ],
            'choice' => [LeadScoringOperator::Equals, LeadScoringOperator::NotEquals, LeadScoringOperator::In, LeadScoringOperator::NotIn],
            default => [LeadScoringOperator::Equals],
        };
    }

    /**
     * @return array<string, string>|null value => label, for choice and yes/no fields
     */
    public function valueOptions(): ?array
    {
        return match ($this) {
            self::Priority => collect(LeadPriority::cases())->mapWithKeys(fn (LeadPriority $p): array => [$p->value => $p->label()])->all(),
            self::SourceType => collect(LeadSourceType::cases())->mapWithKeys(fn (LeadSourceType $t): array => [$t->value => $t->label()])->all(),
            self::Status => LeadStatus::query()->orderBy('sort_order')->pluck('name', 'id')->all(),
            self::HasEmail, self::HasPhone => ['1' => 'Yes', '0' => 'No'],
            default => null,
        };
    }

    public function resolve(Lead $lead): mixed
    {
        return match ($this) {
            self::Priority => $lead->priority->value,
            self::SourceType => $lead->source->type->value,
            self::Status => $lead->status_id,
            self::EstimatedBudget => $lead->estimated_budget !== null ? (float) $lead->estimated_budget : null,
            self::DealValue => $lead->deal_value !== null ? (float) $lead->deal_value : null,
            self::WinProbability => $lead->win_probability,
            self::HasEmail => $lead->email !== null && $lead->email !== '',
            self::HasPhone => $lead->phone !== null && $lead->phone !== '',
            self::DaysSinceCreated => $lead->created_at === null ? null : (int) $lead->created_at->diffInDays(now()),
            self::DaysSinceLastStatusChange => self::daysSinceLastStatusChange($lead),
        };
    }

    public static function daysSinceLastStatusChange(Lead $lead): ?int
    {
        /** @var CarbonInterface|null $since */
        $since = LeadStatusLog::query()->where('lead_id', $lead->id)->latest('created_at')->value('created_at') ?? $lead->created_at;

        return $since === null ? null : (int) $since->diffInDays(now());
    }
}
