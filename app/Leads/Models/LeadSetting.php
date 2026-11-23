<?php

namespace App\Leads\Models;

use App\Leads\Enums\AutoDistributionMethod;
use App\Leads\Enums\LeadDistributionMode;
use Illuminate\Database\Eloquent\Model;

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
