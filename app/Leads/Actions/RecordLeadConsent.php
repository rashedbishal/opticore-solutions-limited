<?php

namespace App\Leads\Actions;

use App\Leads\Enums\ConsentSource;
use App\Leads\Enums\ConsentStatus;
use App\Leads\Enums\ConsentType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadConsent;
use App\Leads\Models\LeadConsentEvent;
use App\Models\Admin;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * The single place consent is recorded: updates the lead's current consent
 * of that type and appends a permanent history entry (same as OptiFin).
 */
class RecordLeadConsent
{
    public function handle(
        Lead $lead,
        ConsentType $type,
        ConsentStatus $status,
        ConsentSource $source,
        ?Admin $changedBy = null,
        ?string $policyVersion = null,
        ?string $policyUrl = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): LeadConsent {
        return DB::transaction(function () use ($lead, $type, $status, $source, $changedBy, $policyVersion, $policyUrl, $ipAddress, $userAgent): LeadConsent {
            $attributes = [
                'lead_id' => $lead->id,
                'lead_identifier' => $lead->identifier,
                'lead_name' => $lead->name,
                'consent_type' => $type,
                'status' => $status,
                'source' => $source,
                'changed_by' => $changedBy?->id,
                'changed_by_name' => $changedBy?->name,
                'policy_version' => $policyVersion,
                'policy_url' => $policyUrl,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent !== null ? mb_substr($userAgent, 0, 500) : null,
                'occurred_at' => now(),
            ];

            $consent = LeadConsent::query()->where('lead_id', $lead->id)->where('consent_type', $type)->first();

            if ($consent === null) {
                try {
                    $consent = DB::transaction(fn (): LeadConsent => LeadConsent::query()->create($attributes));
                } catch (UniqueConstraintViolationException) {
                    $consent = LeadConsent::query()->where('lead_id', $lead->id)->where('consent_type', $type)->firstOrFail();
                    $consent->update($attributes);
                }
            } else {
                $consent->update($attributes);
            }

            LeadConsentEvent::create($attributes);

            return $consent;
        });
    }
}
