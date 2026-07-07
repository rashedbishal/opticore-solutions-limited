<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Cache;

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
        'notes',
        'review_eligible_until',
        'transaction_id',
    ];

    protected static function booted(): void
    {
        static::saved(fn () => self::forgetWorkflowStatsCache());
        static::deleted(fn () => self::forgetWorkflowStatsCache());
    }

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

    /**
     * Get the file attachments submitted by the client at checkout.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(TaskAttachment::class);
    }

    /**
     * Cache key for the admin dashboard's workflow counts. Scoped by
     * year-month so "delivered this month" starts with a guaranteed cache
     * miss (and therefore a fresh, correct count) at the start of a new
     * month without needing a scheduled reset job.
     */
    public static function workflowStatsCacheKey(): string
    {
        return 'admin.dashboard.workflow-stats.'.now()->format('Y-m');
    }

    public static function forgetWorkflowStatsCache(): void
    {
        Cache::forget(self::workflowStatsCacheKey());
    }
}
