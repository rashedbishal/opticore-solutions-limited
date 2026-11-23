<?php

namespace App\Leads\Models;

use App\Leads\Enums\LeadCallPermissionStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property LeadCallPermissionStatus $status
 * @property Carbon|null $expires_at
 * @property Carbon|null $last_synced_at
 * @property Carbon|null $last_requested_at
 */
class LeadCallPermission extends Model
{
    use HasUlids;

    protected $fillable = ['lead_id', 'lead_source_id', 'status', 'meta_raw_status', 'expires_at', 'last_synced_at', 'last_requested_at'];

    protected function casts(): array
    {
        return [
            'status' => LeadCallPermissionStatus::class,
            'expires_at' => 'datetime',
            'last_synced_at' => 'datetime',
            'last_requested_at' => 'datetime',
        ];
    }
}
