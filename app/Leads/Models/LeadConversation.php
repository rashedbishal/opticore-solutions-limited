<?php

namespace App\Leads\Models;

use App\Leads\Enums\MessageChannel;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * One chat thread with one person on one channel source (their Messenger
 * PSID, Instagram id or WhatsApp number is the external_thread_id).
 *
 * @property MessageChannel $channel
 * @property Carbon|null $last_inbound_at
 */
class LeadConversation extends Model
{
    use HasUlids;

    protected $fillable = ['lead_id', 'lead_source_id', 'channel', 'external_thread_id', 'last_inbound_at', 'last_outbound_at'];

    protected function casts(): array
    {
        return [
            'channel' => MessageChannel::class,
            'last_inbound_at' => 'datetime',
            'last_outbound_at' => 'datetime',
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
     * @return HasMany<LeadMessage, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(LeadMessage::class, 'conversation_id');
    }

    /**
     * @return BelongsTo<LeadSource, $this>
     */
    public function leadSource(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class);
    }

    /** Free-form replies are allowed until 24h after the person's last message. */
    public function isWithinMessagingWindow(): bool
    {
        return $this->last_inbound_at !== null
            && $this->last_inbound_at->copy()->addHours($this->channel->windowHours())->isFuture();
    }
}
