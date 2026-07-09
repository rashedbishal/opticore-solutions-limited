<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MealItem extends Model
{
    protected $connection = 'meal';

    protected $fillable = [
        'date',
        'item_name',
        'set_by_admin_id',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    /**
     * The meal item row for the given date, or null if none has been set
     * (or it was cleared) — one row per calendar day means "resets daily"
     * falls out of the schema, no cron job required.
     */
    public static function forDate(string $date): ?self
    {
        return static::query()->where('date', $date)->first();
    }
}
