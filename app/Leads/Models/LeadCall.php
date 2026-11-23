<?php

namespace App\Leads\Models;

use App\Leads\Enums\CallEndReason;
use App\Leads\Enums\CallMetaStage;
use App\Leads\Enums\CallRoutingMode;
use App\Leads\Enums\CallStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One WhatsApp call with a lead.
 *
 * @property string $id
 * @property string $lead_id
 * @property string $lead_source_id
 * @property string|null $conversation_id
 * @property string $external_call_id
 * @property CallStatus $status
 * @property CallEndReason|null $end_reason
 * @property CallMetaStage|null $meta_stage
 * @property string|null $meta_status
 * @property Carbon|null $meta_terminated_at
 * @property int|null $assignee_id_at_arrival
 * @property CallRoutingMode $routing_mode
 * @property array<int, int> $routed_user_ids
 * @property int|null $claimed_by
 * @property string|null $claimed_by_name
 * @property Carbon|null $claimed_at
 * @property Carbon|null $connected_at
 * @property Carbon|null $ended_at
 * @property int|null $duration_seconds
 * @property Carbon|null $ringing_expires_at
 */
class LeadCall extends Model
{
    use HasUlids;

    protected $fillable = [
        'lead_id', 'lead_source_id', 'conversation_id', 'external_call_id', 'direction', 'status', 'end_reason',
        'meta_stage', 'meta_status', 'meta_terminated_at', 'assignee_id_at_arrival', 'routing_mode', 'routed_user_ids',
        'claimed_by', 'claimed_by_name', 'claimed_at', 'connected_at', 'ended_at', 'duration_seconds', 'ringing_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => CallStatus::class,
            'end_reason' => CallEndReason::class,
            'meta_stage' => CallMetaStage::class,
            'routing_mode' => CallRoutingMode::class,
            'routed_user_ids' => 'array',
            'assignee_id_at_arrival' => 'integer',
            'claimed_by' => 'integer',
            'duration_seconds' => 'integer',
            'meta_terminated_at' => 'datetime',
            'claimed_at' => 'datetime',
            'connected_at' => 'datetime',
            'ended_at' => 'datetime',
            'ringing_expires_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Lead, $this>
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * @return BelongsTo<LeadSource, $this>
     */
    public function leadSource(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class);
    }

    public function isRoutedTo(int $adminId): bool
    {
        return in_array($adminId, array_map('intval', $this->routed_user_ids ?? []), true);
    }

    public function isExpired(): bool
    {
        return $this->ringing_expires_at === null || ! $this->ringing_expires_at->isFuture();
    }
}
