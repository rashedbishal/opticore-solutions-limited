<?php

namespace App\Leads\Models;

use App\Leads\Enums\MessageChannel;
use App\Leads\Enums\MessageDirection;
use App\Leads\Enums\MessageStatus;
use App\Leads\Enums\MessageType;
use App\Leads\Events\LeadUpdated;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

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

    /**
     * Every new message, in or out, counts as a change to its lead (as in
     * OptiFin): the lead moves to the top of the list and gets the yellow
     * "updated" mark — also for a picture/file sent with no text, which
     * changes nothing else on the lead. Status updates (delivered, read)
     * don't count.
     */
    protected static function booted(): void
    {
        static::created(function (LeadMessage $message): void {
            DB::table('leads')->where('id', $message->lead_id)->update(['updated_at' => now()]);

            if ($message->direction === MessageDirection::Outbound) {
                LeadUpdated::dispatch($message->lead_id);
            }
        });
    }

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
