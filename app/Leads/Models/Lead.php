<?php

namespace App\Leads\Models;

use App\Leads\Enums\LeadPriority;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Enums\MessageChannel;
use App\Leads\Support\LeadClock;
use Carbon\CarbonInterface;
use Database\Factories\Leads\LeadFactory;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * @property string $id
 * @property string $identifier
 * @property string $source_id
 * @property int|null $assigned_to
 * @property CarbonInterface|null $assigned_at
 * @property string $name
 * @property string|null $email
 * @property string|null $phone
 * @property string|null $message
 * @property array<string, mixed>|null $source_data
 * @property string|null $html_body
 * @property string $status_id
 * @property LeadPriority $priority
 * @property string|null $lead_source
 * @property CarbonInterface|null $next_follow_up_at
 * @property CarbonInterface|null $meeting_date
 * @property string|null $meeting_time
 * @property CarbonInterface|null $first_contacted_at
 * @property CarbonInterface|null $closed_at
 * @property CarbonInterface|null $update_seen_at
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read LeadSource $source
 * @property-read LeadStatus $status
 */
#[UseFactory(LeadFactory::class)]
class Lead extends Model
{
    /** @use HasFactory<LeadFactory> */
    use HasFactory, HasUlids;

    /**
     * `identifier` is deliberately not fillable: it is always reserved from
     * LeadSetting when the lead is created.
     */
    protected $fillable = [
        'source_id', 'assigned_to', 'assigned_at', 'name', 'email', 'phone', 'message', 'source_data',
        'status_id', 'priority', 'company', 'website', 'industry', 'location', 'service_interest',
        'lead_source', 'estimated_budget', 'estimated_budget_currency_id', 'deal_value',
        'deal_value_currency_id', 'win_probability', 'next_follow_up_at', 'meeting_date',
        'meeting_time', 'first_contacted_at', 'closed_at', 'html_body',
    ];

    protected function casts(): array
    {
        return [
            'assigned_to' => 'integer',
            'assigned_at' => 'datetime',
            'source_data' => 'array',
            'priority' => LeadPriority::class,
            'estimated_budget' => 'decimal:2',
            'deal_value' => 'decimal:2',
            'win_probability' => 'integer',
            'next_follow_up_at' => 'date',
            'meeting_date' => 'date',
            'first_contacted_at' => 'datetime',
            'closed_at' => 'datetime',
            'update_seen_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Lead $lead): void {
            if (! $lead->identifier) {
                $lead->identifier = DB::transaction(fn (): string => LeadSetting::reserveNextIdentifier());
            }
        });
    }

    /**
     * @return BelongsTo<LeadSource, $this>
     */
    public function source(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class, 'source_id');
    }

    /**
     * @return BelongsTo<LeadStatus, $this>
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(LeadStatus::class, 'status_id');
    }

    /**
     * @return BelongsTo<Currency, $this>
     */
    public function estimatedBudgetCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'estimated_budget_currency_id');
    }

    /**
     * @return BelongsTo<Currency, $this>
     */
    public function dealValueCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'deal_value_currency_id');
    }

    /**
     * @return HasMany<LeadStatusLog, $this>
     */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(LeadStatusLog::class);
    }

    /**
     * @return HasMany<LeadNote, $this>
     */
    public function notes(): HasMany
    {
        return $this->hasMany(LeadNote::class);
    }

    /**
     * @return HasMany<LeadAssignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(LeadAssignment::class);
    }

    /**
     * @return HasMany<LeadConversation, $this>
     */
    public function conversations(): HasMany
    {
        return $this->hasMany(LeadConversation::class);
    }

    /**
     * @return HasMany<LeadMessage, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(LeadMessage::class);
    }

    /**
     * @return HasMany<LeadAttachment, $this>
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(LeadAttachment::class);
    }

    /**
     * @return BelongsToMany<LeadTag, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(LeadTag::class, 'lead_lead_tag')->withPivot('tagged_by')->withTimestamps();
    }

    /**
     * @return HasMany<Deal, $this>
     */
    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    /**
     * @return HasMany<LeadTask, $this>
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(LeadTask::class);
    }

    /**
     * @return HasMany<LeadCustomFieldValue, $this>
     */
    public function customFieldValues(): HasMany
    {
        return $this->hasMany(LeadCustomFieldValue::class);
    }

    /** The chat channel this lead can be replied on, if any. */
    public function messagingChannel(): ?MessageChannel
    {
        return MessageChannel::fromSourceType($this->source->type);
    }

    /** The lead's conversation on its channel (latest the person wrote in). */
    public function activeConversation(): ?LeadConversation
    {
        $channel = $this->messagingChannel();

        return $channel === null ? null : $this->conversations()->where('channel', $channel)->orderByDesc('last_inbound_at')->first();
    }

    /**
     * @return HasMany<LeadConsent, $this>
     */
    public function consents(): HasMany
    {
        return $this->hasMany(LeadConsent::class);
    }

    /**
     * @return HasMany<LeadConsentEvent, $this>
     */
    public function consentEvents(): HasMany
    {
        return $this->hasMany(LeadConsentEvent::class);
    }

    public function isFacebookLeadAd(): bool
    {
        return $this->source->type === LeadSourceType::FacebookLeadAds;
    }

    /**
     * A Facebook Lead Ad's answers as question name => answer.
     *
     * @return array<string, string>
     */
    public function leadAdFieldValues(): array
    {
        $fieldData = $this->source_data['field_data'] ?? null;

        if (! is_array($fieldData)) {
            return [];
        }

        $values = [];

        foreach ($fieldData as $field) {
            $name = $field['name'] ?? null;
            $value = $field['values'][0] ?? null;

            if (is_string($name) && $name !== '' && is_string($value)) {
                $values[$name] = $value;
            }
        }

        return $values;
    }

    /**
     * @return HasMany<LeadDetailUpdateLog, $this>
     */
    public function detailUpdateLogs(): HasMany
    {
        return $this->hasMany(LeadDetailUpdateLog::class);
    }

    /**
     * Whether the meeting reminder is showing today: switched on, and today
     * is on or after (meeting date − days before), in Bangladesh time. Only the date counts; the
     * meeting time is record-only.
     */
    public function meetingAlertActive(bool $enabled, int $daysBefore): bool
    {
        if (! $enabled || $this->meeting_date === null) {
            return false;
        }

        return LeadClock::today()->gte($this->meeting_date->copy()->subDays($daysBefore));
    }

    /**
     * Same rule as meetingAlertActive(), for the next follow-up date.
     */
    public function followUpAlertActive(bool $enabled, int $daysBefore): bool
    {
        if (! $enabled || $this->next_follow_up_at === null) {
            return false;
        }

        return LeadClock::today()->gte($this->next_follow_up_at->copy()->subDays($daysBefore));
    }

    /** "2:30 PM" when a meeting time was recorded. */
    public function meetingTimeFormatted(): ?string
    {
        return $this->meeting_time !== null ? Carbon::parse($this->meeting_time)->format('g:i A') : null;
    }

    /**
     * Whether the lead changed since anyone last opened it (drives the
     * "updated" highlight). Ignores the first 2 seconds after creation so a
     * brand new lead doesn't also count as updated.
     */
    public function hasUnseenUpdate(): bool
    {
        if ($this->updated_at === null || $this->created_at === null || $this->updated_at->lte($this->created_at->copy()->addSeconds(2))) {
            return false;
        }

        return $this->update_seen_at === null || $this->updated_at->gt($this->update_seen_at);
    }

    /**
     * Marks pending updates as seen without touching updated_at (which would
     * make the lead look freshly updated to everyone else).
     */
    public function markUpdateSeen(): void
    {
        DB::table('leads')->where('id', $this->id)->update(['update_seen_at' => now()]);

        $this->update_seen_at = now();
    }
}
