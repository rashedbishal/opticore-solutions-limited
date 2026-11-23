<?php

namespace App\Leads\Models;

use App\Leads\Enums\DealStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * An opportunity on a lead. A lead may have several deals over time.
 * Open / Won / Lost is independent of the lead's own status.
 *
 * @property DealStatus $status
 * @property Carbon|null $expected_close_date
 * @property Carbon|null $actual_close_date
 */
class Deal extends Model
{
    use HasUlids;

    protected $fillable = [
        'lead_id', 'name', 'value', 'currency_id', 'probability', 'status', 'expected_close_date',
        'actual_close_date', 'owner_id', 'owner_name', 'created_by', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => DealStatus::class,
            'value' => 'decimal:2',
            'probability' => 'integer',
            'owner_id' => 'integer',
            'expected_close_date' => 'date',
            'actual_close_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Currency, $this>
     */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    /**
     * @return HasMany<DealStatusLog, $this>
     */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(DealStatusLog::class);
    }
}
