<?php

namespace App\Leads\Models;

use App\Leads\Enums\LeadAttachmentStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A picture, video, voice note or file a lead sent. Downloaded in the
 * background onto the private disk; only people who can see the lead can
 * open it.
 *
 * @property LeadAttachmentStatus $status
 */
class LeadAttachment extends Model
{
    use HasUlids;

    protected $fillable = ['lead_id', 'type', 'status', 'path', 'mime', 'original_media_url', 'failure_reason', 'sent_at'];

    protected function casts(): array
    {
        return [
            'status' => LeadAttachmentStatus::class,
            'sent_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Lead, $this>
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
