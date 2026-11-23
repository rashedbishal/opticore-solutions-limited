<?php

namespace App\Leads\Models;

use App\Leads\Enums\LeadSourceType;
use Database\Factories\Leads\LeadSourceFactory;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

/**
 * @property LeadSourceType $type
 */
#[UseFactory(LeadSourceFactory::class)]
class LeadSource extends Model
{
    /** @use HasFactory<LeadSourceFactory> */
    use HasFactory, HasUlids;

    protected $fillable = ['type', 'name', 'config', 'is_active', 'singleton_type'];

    protected $hidden = ['config'];

    protected function casts(): array
    {
        return [
            'type' => LeadSourceType::class,
            'config' => 'encrypted:array',
            'is_active' => 'boolean',
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
}
