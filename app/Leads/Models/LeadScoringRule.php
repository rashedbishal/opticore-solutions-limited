<?php

namespace App\Leads\Models;

use App\Leads\Enums\LeadScoringField;
use App\Leads\Enums\LeadScoringOperator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

/**
 * "If {field} {operator} {value}, add {points}" (managers keep these).
 *
 * @property string $name
 * @property string $field
 * @property string $operator
 * @property mixed $value
 * @property int $points
 * @property bool $is_active
 */
class LeadScoringRule extends Model
{
    use HasUlids;

    protected $fillable = ['name', 'field', 'operator', 'value', 'points', 'is_active', 'sort_order'];

    protected function casts(): array
    {
        return [
            'value' => 'json',
            'points' => 'integer',
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

    public function fieldEnum(): ?LeadScoringField
    {
        return LeadScoringField::tryFrom($this->field);
    }

    public function operatorEnum(): ?LeadScoringOperator
    {
        return LeadScoringOperator::tryFrom($this->operator);
    }
}
