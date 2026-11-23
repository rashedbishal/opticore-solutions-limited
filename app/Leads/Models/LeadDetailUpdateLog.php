<?php

namespace App\Leads\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property array<int, string>|null $changed_fields
 * @property string|null $action
 * @property Carbon|null $action_date
 * @property string|null $changed_by_name
 */
class LeadDetailUpdateLog extends Model
{
    protected $fillable = ['lead_id', 'changed_by', 'changed_by_name', 'changed_fields', 'action', 'action_date'];

    protected function casts(): array
    {
        return [
            'changed_fields' => 'array',
            'action_date' => 'date',
        ];
    }
}
