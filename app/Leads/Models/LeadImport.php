<?php

namespace App\Leads\Models;

use App\Leads\Enums\LeadImportStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * One uploaded file of leads and its progress.
 *
 * @property LeadImportStatus $status
 * @property int $total_rows
 * @property int $processed_rows
 * @property int $imported_count
 * @property int $duplicate_count
 * @property int $failed_count
 * @property int $cursor
 * @property int $cursor_row
 * @property Carbon|null $started_at
 * @property Carbon|null $finished_at
 */
class LeadImport extends Model
{
    use HasUlids;

    protected $fillable = [
        'file_name', 'file_path', 'file_type', 'status', 'total_rows', 'processed_rows', 'imported_count',
        'duplicate_count', 'failed_count', 'cursor', 'cursor_row', 'imported_by', 'imported_by_name', 'error', 'started_at', 'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => LeadImportStatus::class,
            'total_rows' => 'integer',
            'processed_rows' => 'integer',
            'imported_count' => 'integer',
            'duplicate_count' => 'integer',
            'failed_count' => 'integer',
            'cursor' => 'integer',
            'cursor_row' => 'integer',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<LeadImportRow, $this>
     */
    public function rows(): HasMany
    {
        return $this->hasMany(LeadImportRow::class);
    }
}
