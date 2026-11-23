<?php

namespace App\Leads\Models;

use App\Leads\Enums\LeadPriority;
use App\Leads\Enums\TaskStatus;
use App\Leads\Support\LeadClock;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A to-do on a lead. Its assignee is chosen per task (copied once, never
 * synced with the lead's owner).
 *
 * @property TaskStatus $status
 * @property LeadPriority $priority
 * @property CarbonInterface|null $due_date
 * @property string|null $due_time
 * @property int|null $assigned_to
 */
class LeadTask extends Model
{
    use HasUlids;

    protected $fillable = [
        'lead_id', 'deal_id', 'title', 'description', 'due_date', 'due_time', 'priority', 'status',
        'closed_at', 'assigned_to', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'priority' => LeadPriority::class,
            'due_date' => 'date',
            'closed_at' => 'datetime',
            'assigned_to' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Lead, $this>
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * @return BelongsTo<Deal, $this>
     */
    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    /**
     * @return HasMany<LeadTaskStatusLog, $this>
     */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(LeadTaskStatusLog::class);
    }

    /** Pending, with a due date on or after (today − days before). */
    public function alertActive(bool $enabled, int $daysBefore): bool
    {
        return $enabled
            && $this->status === TaskStatus::Pending
            && $this->due_date !== null
            && LeadClock::today()->gte($this->due_date->copy()->subDays($daysBefore));
    }
}
