<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OfferMilestone extends Model
{
    protected $fillable = [
        'name',
        'description',
        'revisions',
        'delivery_days',
        'price',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'delivery_days' => 'integer',
            'revisions' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }
}
