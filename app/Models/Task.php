<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
        'image_path',
        'review_eligible_until',
        'transaction_id',
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
            'review_eligible_until' => 'datetime',
        ];
    }

    /**
     * Get the user this task belongs to. Includes soft-deleted users so a
     * client's task history (and their email/name) stays visible in the CMS
     * after they delete their own account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    /**
     * Get the sub-category this task is related to.
     */
    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(PortfolioSubCategory::class, 'sub_category_id');
    }

    /**
     * Get the order (transaction) this task was provisioned from.
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'transaction_id', 'transaction_id');
    }

    /**
     * Get the client review for this task.
     */
    public function review(): HasOne
    {
        return $this->hasOne(ClientReview::class);
    }
}
