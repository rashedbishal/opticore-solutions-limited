<?php

namespace App\Support;

use App\Models\Admin;
use App\Models\MealCancellation;
use App\Models\MealHoliday;
use App\Models\MealSetting;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Single source of truth for "is lunch selection open/blocked right now" —
 * reused by MealManagementController (building UI props), the select()
 * mutation's server-side guard, and the AutoDeclineMealSelections sweep, so
 * the three can never drift out of sync with each other.
 */
class MealScheduleService
{
    /**
     * Admins who participate in the lunch program: everyone who can access
     * the 'meal-management' section (explicitly granted, or full_access),
     * excluding the mother admin, who only oversees and never selects.
     *
     * @return Collection<int, Admin>
     */
    public static function eligibleAdmins(): Collection
    {
        return Admin::query()
            ->where('is_super_admin', false)
            ->get()
            ->filter(fn (Admin $admin) => $admin->canAccess('meal-management'))
            ->values();
    }

    /**
     * @return array<int, int>
     */
    public static function eligibleAdminIds(): array
    {
        return self::eligibleAdmins()->pluck('id')->all();
    }

    public static function isWeeklyHoliday(string $date, ?MealSetting $settings = null): bool
    {
        $settings ??= MealSetting::current();

        return CarbonImmutable::parse($date, MealClock::TIMEZONE)->dayOfWeek === $settings->weekly_holiday_day;
    }

    public static function customHoliday(string $date): ?MealHoliday
    {
        return MealHoliday::query()
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->first();
    }

    public static function cancellation(string $date): ?MealCancellation
    {
        return MealCancellation::query()->where('date', $date)->first();
    }

    /**
     * A human-readable reason lunch selection is blocked for the given date,
     * or null if it isn't blocked. Checked in this order: weekly holiday,
     * ad hoc cancellation (mother admin's note), custom holiday range.
     */
    public static function blockedReason(string $date, ?MealSetting $settings = null): ?string
    {
        if (self::isWeeklyHoliday($date, $settings)) {
            return 'Weekly holiday — no lunch selection today.';
        }

        if ($cancellation = self::cancellation($date)) {
            return $cancellation->note;
        }

        if ($holiday = self::customHoliday($date)) {
            return $holiday->note ?: 'Holiday — no lunch selection today.';
        }

        return null;
    }

    public static function isHolidayOrCancelled(string $date, ?MealSetting $settings = null): bool
    {
        return self::blockedReason($date, $settings) !== null;
    }

    /**
     * True once mother admin has configured both cutoff times — before that,
     * the section stays closed for regular admins entirely.
     */
    public static function isConfigured(?MealSetting $settings = null): bool
    {
        return ($settings ?? MealSetting::current())->isConfigured();
    }

    public static function isSelectionOpen(?MealSetting $settings = null): bool
    {
        $settings ??= MealSetting::current();

        if (! $settings->isConfigured()) {
            return false;
        }

        $now = MealClock::now()->format('H:i:s');

        return $now >= self::normalizeTime($settings->accept_start_time)
            && $now < self::normalizeTime($settings->lock_time);
    }

    public static function isLocked(?MealSetting $settings = null): bool
    {
        $settings ??= MealSetting::current();

        if (! $settings->lock_time) {
            return false;
        }

        return MealClock::now()->format('H:i:s') >= self::normalizeTime($settings->lock_time);
    }

    /**
     * Postgres `time` columns already come back as "HH:MM:SS" strings, which
     * compare correctly lexicographically — this just guards against a
     * driver returning fractional seconds.
     */
    private static function normalizeTime(?string $time): string
    {
        return $time === null ? '' : substr($time, 0, 8);
    }
}
