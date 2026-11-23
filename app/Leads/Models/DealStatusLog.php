<?php

namespace App\Leads\Models;

use App\Leads\Enums\DealStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property DealStatus|null $old_status
 * @property DealStatus $new_status
 */
class DealStatusLog extends Model
{
    protected $fillable = ['deal_id', 'changed_by', 'changed_by_name', 'old_status', 'new_status'];

    protected function casts(): array
    {
        return ['old_status' => DealStatus::class, 'new_status' => DealStatus::class];
    }

    /**
     * @return BelongsTo<Deal, $this>
     */
    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }
}
