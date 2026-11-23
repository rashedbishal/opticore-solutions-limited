<?php

namespace App\Leads\Services;

use App\Leads\Models\Lead;
use App\Leads\Models\LeadScoringRule;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Recomputes a lead's score from scratch (current details + active rules +
 * today's date), clamped to 0–100, as OptiFin does. With no active rules a
 * lead is "not scored" (NULL), never 0.
 */
class LeadScorer
{
    /** Lead columns whose change can change the score. */
    public const array RELEVANT_COLUMNS = [
        'priority', 'source_id', 'status_id', 'estimated_budget', 'deal_value', 'win_probability', 'email', 'phone',
    ];

    /** @var Collection<int, LeadScoringRule>|null */
    private ?Collection $rules = null;

    /** Keep the rules loaded (for the nightly sweep). */
    public function cacheRules(): void
    {
        $this->rules = LeadScoringRule::query()->activeOrdered()->get();
    }

    public function score(Lead $lead): ?int
    {
        $lead->loadMissing('source');
        $rules = $this->rules ?? LeadScoringRule::query()->activeOrdered()->get();

        if ($rules->isEmpty()) {
            DB::table('leads')->where('id', $lead->id)->update(['lead_score' => null, 'lead_score_breakdown' => null, 'lead_score_computed_at' => now()]);

            return null;
        }

        $total = 0;
        $breakdown = [];

        foreach ($rules as $rule) {
            if ($this->matches($rule, $lead)) {
                $total += $rule->points;
                $breakdown[] = ['rule' => $rule->name, 'points' => $rule->points];
            }
        }

        $score = max(0, min(100, $total));

        DB::table('leads')->where('id', $lead->id)->update([
            'lead_score' => $score,
            'lead_score_breakdown' => json_encode(['raw_total' => $total, 'matched' => $breakdown]),
            'lead_score_computed_at' => now(),
        ]);

        return $score;
    }

    private function matches(LeadScoringRule $rule, Lead $lead): bool
    {
        try {
            $field = $rule->fieldEnum();
            $operator = $rule->operatorEnum();

            if ($field === null || $operator === null || ! in_array($operator, $field->allowedOperators(), true)) {
                return false;
            }

            $actual = $field->resolve($lead);

            return $actual !== null && $operator->evaluate($actual, $rule->value);
        } catch (Throwable $e) {
            Log::warning('Lead scoring rule could not be checked.', ['rule_id' => $rule->id, 'error' => $e->getMessage()]);

            return false;
        }
    }
}
