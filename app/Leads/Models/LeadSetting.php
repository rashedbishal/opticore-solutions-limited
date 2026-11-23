<?php

namespace App\Leads\Models;

use App\Leads\Enums\AutoDistributionMethod;
use App\Leads\Enums\LeadDistributionMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * The single row of Lead Management settings (mother admin → Lead Settings
 * → General). Always read through current(); never cached, because
 * next_lead_number is a live counter.
 *
 * @property LeadDistributionMode $distribution_mode
 * @property AutoDistributionMethod|null $auto_distribution_method
 * @property string $lead_id_prefix
 * @property int $next_lead_number
 * @property bool $meeting_alert_enabled
 * @property int $meeting_alert_days_before
 * @property bool $followup_alert_enabled
 * @property int $followup_alert_days_before
 * @property bool $task_alert_enabled
 * @property int $task_alert_days_before
 * @property bool $nurturing_notify_enabled
 * @property bool $nurturing_task_enabled
 * @property int $nurturing_inactive_days
 * @property string|null $vapid_public_key
 * @property string|null $vapid_private_key
 * @property string|null $ringtone_path
 * @property string|null $ringtone_name
 * @property array<string, mixed>|null $firebase_service_account
 * @property string|null $apk_path
 * @property string|null $apk_version
 * @property int|null $apk_version_code
 * @property int|null $apk_size
 * @property string|null $apk_notes
 * @property Carbon|null $apk_uploaded_at
 */
class LeadSetting extends Model
{
    protected $fillable = [
        'distribution_mode',
        'auto_distribution_method',
        'lead_id_prefix',
        'meeting_alert_enabled',
        'meeting_alert_days_before',
        'followup_alert_enabled',
        'followup_alert_days_before',
        'task_alert_enabled',
        'task_alert_days_before',
        'nurturing_notify_enabled',
        'nurturing_task_enabled',
        'nurturing_inactive_days',
        'vapid_public_key',
        'vapid_private_key',
        'ringtone_path',
        'ringtone_name',
        'firebase_service_account',
        'apk_path',
        'apk_version',
        'apk_version_code',
        'apk_size',
        'apk_notes',
        'apk_uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'distribution_mode' => LeadDistributionMode::class,
            'auto_distribution_method' => AutoDistributionMethod::class,
            'next_lead_number' => 'integer',
            'meeting_alert_enabled' => 'boolean',
            'meeting_alert_days_before' => 'integer',
            'followup_alert_enabled' => 'boolean',
            'followup_alert_days_before' => 'integer',
            'task_alert_enabled' => 'boolean',
            'task_alert_days_before' => 'integer',
            'nurturing_notify_enabled' => 'boolean',
            'nurturing_task_enabled' => 'boolean',
            'nurturing_inactive_days' => 'integer',
            'vapid_private_key' => 'encrypted',
            'firebase_service_account' => 'encrypted:array',
            'apk_version_code' => 'integer',
            'apk_size' => 'integer',
            'apk_uploaded_at' => 'datetime',
        ];
    }

    public static function current(): self
    {
        return static::query()->firstOrCreate([]);
    }

    /**
     * Reserves the next {prefix}-LEAD-{n} number under a row lock, so leads
     * created at the same moment never share a number. Numbers only ever go
     * up; deleting a lead never frees its number.
     */
    public static function reserveNextIdentifier(): string
    {
        $setting = static::query()->lockForUpdate()->firstOrFail();
        $number = $setting->next_lead_number;
        $setting->increment('next_lead_number');

        return "{$setting->lead_id_prefix}-LEAD-{$number}";
    }
}
