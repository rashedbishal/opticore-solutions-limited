<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_name',
        'user_id',
        'category',
        'sub_category_id',
        'task_name',
        'date',
        'state',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    /**
     * Get the user this task belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the sub-category this task is related to.
     */
    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(PortfolioSubCategory::class, 'sub_category_id');
    }
}
