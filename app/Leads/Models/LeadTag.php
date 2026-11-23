<?php

namespace App\Leads\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * A colour label for leads (e.g. "VIP"). Managers keep the list; anyone
 * working a lead can put tags on it.
 */
class LeadTag extends Model
{
    use HasUlids;

    protected $fillable = ['name', 'slug', 'color'];

    /**
     * @return array<int, string>
     */
    public static function availableColors(): array
    {
        return LeadStatus::availableColors();
    }

    /**
     * @return BelongsToMany<Lead, $this>
     */
    public function leads(): BelongsToMany
    {
        return $this->belongsToMany(Lead::class, 'lead_lead_tag')->withTimestamps();
    }
}
