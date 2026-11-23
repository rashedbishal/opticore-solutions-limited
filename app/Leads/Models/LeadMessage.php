<?php

namespace App\Leads\Models;

use App\Leads\Enums\MessageChannel;
use App\Leads\Enums\MessageDirection;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property MessageChannel $channel
 * @property MessageDirection $direction
 * @property array<string, mixed>|null $metadata
 */
class LeadMessage extends Model
{
    use HasUlids;

    protected $fillable = [
        'conversation_id', 'lead_id', 'channel', 'direction', 'message_type', 'body',
        'external_message_id', 'external_participant_id', 'status', 'status_updated_at',
        'failure_reason', 'sent_by', 'sent_by_name', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'channel' => MessageChannel::class,
            'direction' => MessageDirection::class,
            'status_updated_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * @return BelongsTo<LeadConversation, $this>
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(LeadConversation::class, 'conversation_id');
    }
}
