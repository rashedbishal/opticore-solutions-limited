<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A file moved to the storage recycle bin.
 *
 * @property string $disk
 * @property string $original_path
 * @property string $bin_path
 * @property int $size
 * @property string|null $deleted_by_name
 * @property Carbon $expires_at
 */
class StorageRecycleItem extends Model
{
    use HasUlids;

    protected $fillable = ['disk', 'original_path', 'bin_path', 'size', 'deleted_by_name', 'expires_at'];

    protected function casts(): array
    {
        return ['size' => 'integer', 'expires_at' => 'datetime'];
    }
}
