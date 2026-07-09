<?php

namespace App\Support;

use Carbon\CarbonImmutable;

/**
 * Every meal-management cutoff/reset is evaluated against the office's wall
 * clock, not the app's default timezone (which stays UTC everywhere else in
 * this codebase). Centralizing the "Asia/Dhaka" literal here means it's set
 * in one place — see how Password::defaults() is centralized similarly.
 */
class MealClock
{
    public const TIMEZONE = 'Asia/Dhaka';

    public static function now(): CarbonImmutable
    {
        return CarbonImmutable::now(self::TIMEZONE);
    }

    public static function today(): string
    {
        return self::now()->toDateString();
    }
}
