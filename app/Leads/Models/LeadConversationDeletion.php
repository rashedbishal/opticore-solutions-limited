<?php

namespace App\Leads\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Record of a lead's conversation being deleted (who, when, how much).
 */
class LeadConversationDeletion extends Model
{
    protected $fillable = ['lead_id', 'lead_identifier', 'lead_name', 'channel', 'deleted_by', 'deleted_by_name', 'summary'];

    protected function casts(): array
    {
        return ['summary' => 'array'];
    }
}
