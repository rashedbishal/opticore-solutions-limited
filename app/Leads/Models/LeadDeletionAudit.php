<?php

namespace App\Leads\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Permanent record of a deleted lead: who deleted it, when, and what it
 * was. Has no foreign key to `leads` on purpose — the lead is gone.
 */
class LeadDeletionAudit extends Model
{
    protected $fillable = [
        'lead_id', 'lead_identifier', 'lead_name', 'lead_email', 'lead_phone',
        'source_type', 'deleted_by', 'deleted_by_name', 'is_bulk', 'cascade_summary',
    ];

    protected function casts(): array
    {
        return [
            'is_bulk' => 'boolean',
            'cascade_summary' => 'array',
        ];
    }
}
