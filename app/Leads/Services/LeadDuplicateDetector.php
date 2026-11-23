<?php

namespace App\Leads\Services;

use App\Leads\Enums\LeadDuplicateLinkStatus;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadDuplicateLink;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\UniqueConstraintViolationException;

/**
 * Finds leads with the same email or phone (any channel) and records each
 * pair once as "pending" for a manager to merge or dismiss. Run live when a
 * lead is opened, and nightly for pairs nobody has opened.
 */
class LeadDuplicateDetector
{
    /**
     * @return Collection<int, LeadDuplicateLink> this lead's pending pairs
     */
    public function detectFor(Lead $lead): Collection
    {
        if ($lead->isMerged()) {
            return new Collection;
        }

        $email = $lead->email_normalized;
        $phone = $lead->phone_normalized;

        if ($email !== null || $phone !== null) {
            $candidates = Lead::query()
                ->whereKeyNot($lead->id)
                ->where(function (Builder $query) use ($email, $phone): void {
                    if ($email !== null) {
                        $query->orWhere('email_normalized', $email);
                    }

                    if ($phone !== null) {
                        $query->orWhere('phone_normalized', $phone);
                    }
                })
                ->get(['id', 'email_normalized', 'phone_normalized']);

            foreach ($candidates as $candidate) {
                $matched = array_values(array_filter([
                    $email !== null && $candidate->email_normalized === $email ? 'email' : null,
                    $phone !== null && $candidate->phone_normalized === $phone ? 'phone' : null,
                ]));

                if ($matched !== []) {
                    $this->record($lead, $candidate, $matched);
                }
            }
        }

        return $this->pendingFor($lead);
    }

    /**
     * Pending pairs whose other lead still exists and isn't merged.
     *
     * @return Collection<int, LeadDuplicateLink>
     */
    public function pendingFor(Lead $lead): Collection
    {
        return LeadDuplicateLink::query()
            ->where(fn (Builder $q) => $q->where('lead_id', $lead->id)->orWhere('duplicate_lead_id', $lead->id))
            ->where('status', LeadDuplicateLinkStatus::Pending)
            ->with(['lead', 'duplicateLead'])
            ->get()
            ->filter(fn (LeadDuplicateLink $link): bool => $link->lead !== null && $link->duplicateLead !== null
                && ! $link->lead->isMerged() && ! $link->duplicateLead->isMerged())
            ->values();
    }

    /**
     * @param  array<int, string>  $matched
     */
    private function record(Lead $a, Lead $b, array $matched): void
    {
        [$leadId, $duplicateId] = LeadDuplicateLink::pairKeys($a, $b);

        if (LeadDuplicateLink::query()->where('lead_id', $leadId)->where('duplicate_lead_id', $duplicateId)->exists()) {
            return;
        }

        try {
            LeadDuplicateLink::query()->create([
                'lead_id' => $leadId,
                'duplicate_lead_id' => $duplicateId,
                'status' => LeadDuplicateLinkStatus::Pending,
                'matched_fields' => $matched,
                'detected_at' => now(),
            ]);
        } catch (UniqueConstraintViolationException) {
            // Another request recorded the same pair first.
        }
    }

    public static function normalizeEmail(?string $email): ?string
    {
        $email = trim((string) $email);

        return $email === '' ? null : mb_strtolower($email);
    }

    public static function normalizePhone(?string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone);

        return $digits === null || $digits === '' ? null : $digits;
    }
}
