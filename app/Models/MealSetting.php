<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class MealSetting extends Model
{
    /**
     * Cache key for the singleton settings row.
     */
    public const CACHE_KEY = 'meal-settings.current';

    protected $connection = 'meal';

    protected $fillable = [
        'accept_start_time',
        'lock_time',
        'weekly_holiday_day',
    ];

    protected $casts = [
        'weekly_holiday_day' => 'integer',
    ];

    /**
     * The single settings row, cached indefinitely and created with
     * all-null/default values on first access. Mirrors
     * SiteSetting::current()'s attributes-only caching so the value
     * survives serialization on non-array cache stores.
     */
    public static function current(): self
    {
        $attributes = Cache::rememberForever(self::CACHE_KEY, function () {
            return (self::query()->first() ?? self::create([]))->getAttributes();
        });

        return (new self)->newFromBuilder($attributes);
    }

    /**
     * Forget the cached singleton so the next current() call re-reads the
     * latest values from the database.
     */
    public static function forgetCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    public function isConfigured(): bool
    {
        return $this->accept_start_time !== null && $this->lock_time !== null;
    }
}
