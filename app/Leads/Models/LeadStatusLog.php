<?php

namespace App\Leads\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadStatusLog extends Model
{
    protected $fillable = ['lead_id', 'changed_by', 'changed_by_name', 'old_status_id', 'new_status_id', 'note'];

    /**
     * @return BelongsTo<LeadStatus, $this>
     */
    public function oldStatus(): BelongsTo
    {
        return $this->belongsTo(LeadStatus::class, 'old_status_id');
    }

    /**
     * @return BelongsTo<LeadStatus, $this>
     */
    public function newStatus(): BelongsTo
    {
        return $this->belongsTo(LeadStatus::class, 'new_status_id');
    }
}
