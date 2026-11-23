<?php

namespace App\Leads\Models;

use App\Leads\Enums\LeadCustomFieldType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An extra field on every lead (managers keep the list). Its type and
 * choices lock once any lead has a value.
 *
 * @property LeadCustomFieldType $type
 * @property array<int, string>|null $options
 * @property bool $is_required
 * @property bool $is_active
 */
class LeadCustomFieldDefinition extends Model
{
    use HasUlids;

    protected $fillable = ['name', 'key', 'type', 'options', 'is_required', 'is_active', 'sort_order'];

    protected function casts(): array
    {
        return [
            'type' => LeadCustomFieldType::class,
            'options' => 'array',
            'is_required' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeActiveOrdered(Builder $query): Builder
    {
        return $query->where('is_active', true)->orderBy('sort_order')->orderBy('created_at');
    }

    /**
     * @return HasMany<LeadCustomFieldValue, $this>
     */
    public function values(): HasMany
    {
        return $this->hasMany(LeadCustomFieldValue::class);
    }

    /**
     * @return array<int, mixed>
     */
    public function rules(): array
    {
        return $this->type->rules($this->is_required, $this->options);
    }
}
