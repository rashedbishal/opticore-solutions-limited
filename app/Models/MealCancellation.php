<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MealCancellation extends Model
{
    protected $connection = 'meal';

    protected $fillable = [
        'date',
        'note',
        'cancelled_by_admin_id',
    ];

    protected $casts = [
        'date' => 'date',
    ];
}
