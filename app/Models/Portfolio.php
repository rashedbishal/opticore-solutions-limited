<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class Portfolio extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'category',
        'sub_category_id',
        'media_path',
        'media_type',
        'alt',
    ];

    protected static function booted(): void
    {
        static::saved(fn () => self::forgetDashboardCountCache());
        static::deleted(fn () => self::forgetDashboardCountCache());
    }

    /**
     * Get the sub-category this portfolio belongs to.
     */
    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(PortfolioSubCategory::class, 'sub_category_id');
    }

    public static function dashboardCountCacheKey(): string
    {
        return 'admin.dashboard.portfolios.count';
    }

    public static function forgetDashboardCountCache(): void
    {
        Cache::forget(self::dashboardCountCacheKey());
    }
}
