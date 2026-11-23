<?php

namespace App\Leads\Models;

use App\Leads\Enums\TokenCheckStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * The latest daily key check for one Meta source. Never stores the key.
 *
 * @property TokenCheckStatus $status
 * @property Carbon|null $expires_at
 * @property Carbon $checked_at
 */
class LeadSourceTokenCheck extends Model
{
    protected $fillable = ['lead_source_id', 'status', 'expires_at', 'expiry_known', 'error', 'checked_at'];

    protected function casts(): array
    {
        return [
            'status' => TokenCheckStatus::class,
            'expires_at' => 'datetime',
            'expiry_known' => 'boolean',
            'checked_at' => 'datetime',
        ];
    }
}
