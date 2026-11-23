<?php

namespace App\Leads\Models;

use App\Leads\Enums\LeadImportRowStatus;
use Illuminate\Database\Eloquent\Model;

/**
 * @property LeadImportRowStatus $status
 * @property array<string, string|null> $data
 * @property array<int, string>|null $errors
 */
class LeadImportRow extends Model
{
    protected $fillable = [
        'lead_import_id', 'row_number', 'status', 'data', 'errors', 'email_normalized', 'phone_normalized', 'lead_id', 'duplicate_of',
    ];

    protected function casts(): array
    {
        return [
            'status' => LeadImportRowStatus::class,
            'data' => 'array',
            'errors' => 'array',
            'row_number' => 'integer',
        ];
    }
}
