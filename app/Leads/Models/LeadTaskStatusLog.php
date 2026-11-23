<?php

namespace App\Leads\Models;

use App\Leads\Enums\TaskStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property TaskStatus|null $old_status
 * @property TaskStatus $new_status
 */
class LeadTaskStatusLog extends Model
{
    protected $fillable = ['lead_task_id', 'changed_by', 'changed_by_name', 'old_status', 'new_status'];

    protected function casts(): array
    {
        return ['old_status' => TaskStatus::class, 'new_status' => TaskStatus::class];
    }

    /**
     * @return BelongsTo<LeadTask, $this>
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(LeadTask::class, 'lead_task_id');
    }
}
