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
     * Whether anything references this status, which blocks deleting it.
     * Nothing can reference a status until leads exist; the lead and
     * status-history checks are added together with those tables.
     */
    public function isInUse(): bool
    {
        return false;
    }
}
