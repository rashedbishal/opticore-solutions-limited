<?php

namespace App\Leads\Models;

use Database\Factories\Leads\LeadStatusFactory;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One column of the lead pipeline (board). Managed by the mother admin at
 * Lead Settings → Statuses; `sort_order` is the board's left-to-right order.
 */
#[UseFactory(LeadStatusFactory::class)]
class LeadStatus extends Model
{
    /** @use HasFactory<LeadStatusFactory> */
    use HasFactory, HasUlids;

    protected $fillable = ['name', 'slug', 'color', 'is_closed', 'sort_order'];

    /**
     * @return array<int, string>
     */
    public static function availableColors(): array
    {
        return [
            'blue', 'sky', 'indigo', 'amber', 'orange', 'green',
            'red', 'zinc', 'emerald', 'purple', 'teal', 'pink',
        ];
    }

    protected function casts(): array
    {
        return [
            'is_closed' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Whether anything references this status, which blocks deleting it: a
     * lead currently in it, or any status-history entry (history has no
     * cleanup path, so a status that ever appeared there stays forever).
     */
    public function isInUse(): bool
    {
        return LeadStatusLog::query()
            ->where('old_status_id', $this->id)
            ->orWhere('new_status_id', $this->id)
            ->exists()
            || Lead::query()->where('status_id', $this->id)->exists();
    }

    /**
     * The board's first column — where every new lead starts.
     */
    public static function initial(): ?self
    {
        return static::query()->orderBy('sort_order')->first();
    }
}
