<?php

namespace App\Models;

use Database\Factories\JobApplicationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class JobApplication extends Model
{
    /** @use HasFactory<JobApplicationFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'role',
        'portfolio_url',
        'resume_path',
        'resume_original_name',
    ];

    protected static function booted(): void
    {
        static::saved(fn () => self::forgetDashboardCountCache());
        static::deleted(fn () => self::forgetDashboardCountCache());
    }

    public static function dashboardCountCacheKey(): string
    {
        return 'admin.dashboard.job_applications.count';
    }

    public static function forgetDashboardCountCache(): void
    {
        Cache::forget(self::dashboardCountCacheKey());
    }
}
