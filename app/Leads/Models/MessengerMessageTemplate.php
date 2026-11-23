<?php

namespace App\Leads\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A Messenger template staff can send after the 24-hour reply window closes.
 *
 * @property int $variable_count
 */
class MessengerMessageTemplate extends Model
{
    use HasUlids;

    protected $table = 'messenger_message_templates';

    protected $fillable = ['lead_source_id', 'name', 'language', 'variable_count', 'is_active', 'body_text'];

    protected function casts(): array
    {
        return ['variable_count' => 'integer', 'is_active' => 'boolean'];
    }

    /**
     * @return BelongsTo<LeadSource, $this>
     */
    public function leadSource(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class);
    }
}
