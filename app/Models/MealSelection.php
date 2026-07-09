<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MealSelection extends Model
{
    protected $connection = 'meal';

    protected $fillable = [
        'date',
        'admin_id',
        'status',
        'is_auto_declined',
        'decided_at',
        'overridden_by_admin_id',
        'overridden_at',
    ];

    protected $casts = [
        'date' => 'date',
        'is_auto_declined' => 'boolean',
        'decided_at' => 'datetime',
        'overridden_at' => 'datetime',
    ];

    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }
}
