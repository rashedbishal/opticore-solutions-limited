<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MealHoliday extends Model
{
    protected $connection = 'meal';

    protected $fillable = [
        'start_date',
        'end_date',
        'note',
        'created_by_admin_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function covers(string $date): bool
    {
        return $date >= $this->start_date->toDateString() && $date <= $this->end_date->toDateString();
    }
}
