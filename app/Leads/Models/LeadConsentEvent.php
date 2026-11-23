<?php

namespace App\Leads\Models;

use App\Leads\Enums\ConsentSource;
use App\Leads\Enums\ConsentStatus;
use App\Leads\Enums\ConsentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Permanent, append-only history of every consent grant and withdrawal. Kept even after the lead is deleted.
 *
 * @property ConsentType $consent_type
 * @property ConsentStatus $status
 * @property ConsentSource $source
 * @property Carbon $occurred_at
 * @property string|null $changed_by_name
 * @property string|null $policy_version
 * @property string|null $policy_url
 * @property string|null $ip_address
 */
class LeadConsentEvent extends Model
{
    protected $fillable = [
        'lead_id', 'lead_identifier', 'lead_name', 'consent_type', 'status', 'source', 'changed_by', 'changed_by_name', 'policy_version', 'policy_url', 'ip_address',
        'user_agent', 'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'consent_type' => ConsentType::class,
            'status' => ConsentStatus::class,
            'source' => ConsentSource::class,
            'occurred_at' => 'datetime',
        ];
    }
}
