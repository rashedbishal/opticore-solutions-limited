<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'sub_category_id',
        'category_slug',
        'username',
        'client_type',
        'rating',
        'comment',
        'image_path',
        'price_range',
        'work_duration',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Includes soft-deleted users so a review stays attributable in the CMS
     * after the reviewing client deletes their own account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(PortfolioSubCategory::class, 'sub_category_id');
    }
}
