<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Blog extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'category',
        'excerpt',
        'content',
        'image',
        'author',
        'read_time',
    ];

    protected static function booted(): void
    {
        static::saved(fn () => self::forgetDashboardCountCache());
        static::deleted(fn () => self::forgetDashboardCountCache());
    }

    public static function dashboardCountCacheKey(): string
    {
        return 'admin.dashboard.blogs.count';
    }

    public static function forgetDashboardCountCache(): void
    {
        Cache::forget(self::dashboardCountCacheKey());
    }
}
