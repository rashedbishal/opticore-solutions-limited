<?php

namespace App\Leads\Support;

use Carbon\CarbonImmutable;

/**
 * Lead Management's calendar runs on Bangladesh time (reminders, "today",
 * "date can't be in the past"), while the app itself stays UTC — the same
 * approach as MealClock.
 */
class LeadClock
{
    public const TIMEZONE = 'Asia/Dhaka';

    public static function now(): CarbonImmutable
    {
        return CarbonImmutable::now(self::TIMEZONE);
    }

    /** Today's date in Bangladesh, at midnight (as a date with no time). */
    public static function today(): CarbonImmutable
    {
        return CarbonImmutable::parse(self::now()->toDateString(), 'UTC');
    }

    /** Today's date in Bangladesh as Y-m-d. */
    public static function todayString(): string
    {
        return self::now()->toDateString();
    }

    /**
     * The UTC instants where today (Bangladesh) starts and ends.
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    public static function todayRangeUtc(): array
    {
        $start = self::now()->startOfDay();

        return [$start->utc(), $start->addDay()->utc()];
    }
}
