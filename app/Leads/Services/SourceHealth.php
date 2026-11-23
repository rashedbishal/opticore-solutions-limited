<?php

namespace App\Leads\Services;

use App\Leads\Enums\FailedEmailMessageStatus;
use App\Leads\Enums\IntegrationProblem;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Enums\TokenCheckStatus;
use App\Leads\Models\FailedEmailMessage;
use App\Leads\Models\LeadSource;
use Carbon\CarbonInterface;

/**
 * The single place the channel health rules live (same rules as OptiFin's
 * Integrations page): quiet for 7 days, a rejected webhook in the last 7
 * days, and for Meta channels a missing, rejected or soon-expiring key.
 */
class SourceHealth
{
    public function __construct(private readonly InboxHealth $inbox) {}

    public const QUIET_AFTER_DAYS = 7;

    public const TOKEN_EXPIRY_WARNING_DAYS = 7;

    public const RECENT_DAYS = 7;

    /**
     * @return array{problems: array<int, array{problem: string, label: string, serious: bool, detail: string}>, info: string|null}
     */
    public function of(LeadSource $source): array
    {
        if ($source->type->isBuiltIn() || ! $source->is_active) {
            return ['problems' => [], 'info' => null];
        }

        $problems = [];
        $info = null;
        $quietSince = now()->subDays(self::QUIET_AFTER_DAYS);

        if ($source->last_synced_at === null) {
            if ($source->created_at !== null && $source->created_at->lt($quietSince)) {
                $problems[] = $this->problem(IntegrationProblem::Quiet, 'Nothing has ever arrived from this source.');
            } else {
                $info = 'No activity yet';
            }
        } elseif ($source->last_synced_at->lt($quietSince)) {
            $problems[] = $this->problem(IntegrationProblem::Quiet, 'Nothing has arrived for '.$source->last_synced_at->diffForHumans(syntax: CarbonInterface::DIFF_ABSOLUTE).'.');
        }

        if ($source->last_signature_rejection_at !== null && $source->last_signature_rejection_at->gte(now()->subDays(self::RECENT_DAYS))) {
            $problems[] = $this->problem(IntegrationProblem::WebhookRejected, ($source->last_signature_rejection_reason ?? 'A webhook signature was rejected.').' ('.$source->last_signature_rejection_at->diffForHumans().')');
        }

        if ($source->type === LeadSourceType::Email) {
            $failures = $this->inbox->consecutiveFailures($source);

            if ($failures >= (int) config('leads.imap_failure_threshold')) {
                $problems[] = $this->problem(IntegrationProblem::InboxCannotConnect, "Failed to connect {$failures} times in a row.");
            }

            $failedEmails = FailedEmailMessage::query()
                ->where('lead_source_id', $source->id)
                ->whereIn('status', [FailedEmailMessageStatus::Failed, FailedEmailMessageStatus::Exhausted])
                ->where('first_failed_at', '>=', now()->subDays(self::RECENT_DAYS))
                ->count();

            if ($failedEmails > 0) {
                $problems[] = $this->problem(IntegrationProblem::EmailsFailed, "{$failedEmails} ".($failedEmails === 1 ? 'email' : 'emails').' failed to import in the last 7 days.');
            }
        }

        if ($source->type->isMeta()) {
            $check = $source->tokenCheck;

            if ($source->metaAccessToken() === null) {
                $problems[] = $this->problem(IntegrationProblem::TokenMissing, 'No access token is configured on this source.');
            } elseif ($check?->status === TokenCheckStatus::Invalid) {
                $problems[] = $this->problem(IntegrationProblem::TokenInvalid, ($check->error ?? 'Meta rejected the token.').' (checked '.$check->checked_at->diffForHumans().')');
            } elseif ($check?->status === TokenCheckStatus::Valid && $check->expires_at !== null && $check->expires_at->lt(now()->addDays(self::TOKEN_EXPIRY_WARNING_DAYS))) {
                $problems[] = $this->problem(IntegrationProblem::TokenExpiresSoon, 'The token expires '.$check->expires_at->diffForHumans().'.');
            } elseif ($check === null && $info === null) {
                $info = 'Token not checked yet';
            }
        }

        return ['problems' => $problems, 'info' => $info];
    }

    /**
     * @return array{problem: string, label: string, serious: bool, detail: string}
     */
    private function problem(IntegrationProblem $problem, string $detail): array
    {
        return ['problem' => $problem->value, 'label' => $problem->label(), 'serious' => $problem->isSerious(), 'detail' => $detail];
    }
}
