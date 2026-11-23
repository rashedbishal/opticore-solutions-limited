<?php

namespace App\Leads\Models;

use App\Leads\Enums\LeadDuplicateLinkStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Two leads that look like the same person (same email or phone), and what
 * a manager decided about them. Kept as the audit trail of merges.
 *
 * @property LeadDuplicateLinkStatus $status
 * @property array<int, string> $matched_fields
 */
class LeadDuplicateLink extends Model
{
    use HasUlids;

    protected $fillable = [
        'lead_id', 'duplicate_lead_id', 'status', 'matched_fields', 'detected_at',
        'resolved_by', 'resolved_by_name', 'resolved_at', 'field_resolutions',
    ];

    protected function casts(): array
    {
        return [
            'status' => LeadDuplicateLinkStatus::class,
            'matched_fields' => 'array',
            'field_resolutions' => 'array',
            'detected_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    /**
     * The pair's ids in stored order (smaller first).
     *
     * @return array{0: string, 1: string}
     */
    public static function pairKeys(Lead $a, Lead $b): array
    {
        return strcmp($a->id, $b->id) < 0 ? [$a->id, $b->id] : [$b->id, $a->id];
    }

    public function involves(Lead $lead): bool
    {
        return $this->lead_id === $lead->id || $this->duplicate_lead_id === $lead->id;
    }

    public function otherId(Lead $lead): string
    {
        return $this->lead_id === $lead->id ? $this->duplicate_lead_id : $this->lead_id;
    }

    /**
     * @return BelongsTo<Lead, $this>
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class)->withMerged();
    }

    /**
     * @return BelongsTo<Lead, $this>
     */
    public function duplicateLead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'duplicate_lead_id')->withMerged();
    }
}
