<?php

namespace App\Leads\Models;

use App\Leads\Enums\MessageChannel;
use App\Leads\Enums\MessageDirection;
use App\Leads\Enums\MessageStatus;
use App\Leads\Enums\MessageType;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property MessageChannel $channel
 * @property MessageDirection $direction
 * @property MessageType $message_type
 * @property MessageStatus|null $status
 * @property array<string, mixed>|null $metadata
 * @property array<int, string>|null $template_variables
 * @property string|null $attachment_path
 * @property string|null $resend_message_id
 */
class LeadMessage extends Model
{
    use HasUlids;

    protected $fillable = [
        'conversation_id', 'lead_id', 'channel', 'direction', 'message_type', 'body',
        'external_message_id', 'external_participant_id', 'status', 'status_updated_at',
        'failure_reason', 'sent_by', 'sent_by_name', 'metadata', 'attachment_path', 'attachment_mime',
        'attachment_name', 'attachment_size', 'template_name', 'template_language', 'template_variables',
    ];

    protected function casts(): array
    {
        return [
            'channel' => MessageChannel::class,
            'direction' => MessageDirection::class,
            'message_type' => MessageType::class,
            'status' => MessageStatus::class,
            'status_updated_at' => 'datetime',
            'metadata' => 'array',
            'template_variables' => 'array',
            'activity_log_hidden_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<LeadConversation, $this>
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(LeadConversation::class, 'conversation_id');
    }

    /**
     * @return BelongsTo<Lead, $this>
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function hasMedia(): bool
    {
        return in_array($this->message_type, [MessageType::Image, MessageType::Document], true) && $this->attachment_path !== null;
    }
}
