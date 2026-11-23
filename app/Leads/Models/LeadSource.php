<?php

namespace App\Leads\Models;

use App\Leads\Enums\LeadSourceType;
use Database\Factories\Leads\LeadSourceFactory;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * @property LeadSourceType $type
 * @property array<string, mixed>|null $config
 * @property bool $is_active
 * @property Carbon|null $last_synced_at
 * @property Carbon|null $last_signature_rejection_at
 * @property string|null $last_signature_rejection_reason
 * @property Carbon|null $created_at
 */
#[UseFactory(LeadSourceFactory::class)]
class LeadSource extends Model
{
    /** @use HasFactory<LeadSourceFactory> */
    use HasFactory, HasUlids;

    protected $fillable = [
        'type', 'name', 'config', 'is_active', 'singleton_type',
        'last_synced_at', 'last_signature_rejection_at', 'last_signature_rejection_reason',
    ];

    protected $hidden = ['config'];

    protected function casts(): array
    {
        return [
            'type' => LeadSourceType::class,
            'config' => 'encrypted:array',
            'is_active' => 'boolean',
            'last_synced_at' => 'datetime',
            'last_signature_rejection_at' => 'datetime',
        ];
    }

    public static function ofType(LeadSourceType $type): self
    {
        return static::query()->where('singleton_type', $type->value)->firstOrFail();
    }

    /**
     * @return HasMany<Lead, $this>
     */
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'source_id');
    }

    /**
     * Ids of the agents allowed to see this source's unowned leads.
     *
     * @return array<int, int>
     */
    public function unassignedViewerIds(): array
    {
        return DB::table('lead_source_unassigned_viewers')
            ->where('lead_source_id', $this->id)
            ->pluck('admin_id')
            ->map(fn ($id): int => (int) $id)
            ->all();
    }

    /**
     * @return HasOne<LeadSourceTokenCheck, $this>
     */
    public function tokenCheck(): HasOne
    {
        return $this->hasOne(LeadSourceTokenCheck::class);
    }

    /** The key Meta uses for API calls on this source, if any. */
    public function metaAccessToken(): ?string
    {
        $token = $this->config['page_access_token'] ?? $this->config['access_token'] ?? null;

        return is_string($token) && $token !== '' ? $token : null;
    }

    /** The address to paste into the Meta app's webhook settings. */
    public function webhookUrl(): ?string
    {
        return match ($this->type) {
            LeadSourceType::FacebookMessenger, LeadSourceType::FacebookLeadAds => route('api.webhook.facebook'),
            LeadSourceType::Instagram => route('api.webhook.instagram'),
            LeadSourceType::Whatsapp => route('api.webhook.whatsapp'),
            default => null,
        };
    }
}
