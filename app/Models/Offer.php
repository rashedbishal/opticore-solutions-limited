<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Offer extends Model
{
    protected $fillable = [
        'sub_category_id',
        'category_slug',
        'payment_type',
        'description',
        'request_requirements',
        'price',
        'delivery_days',
        'revisions',
        'expires_at',
        'offer_token',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'request_requirements' => 'boolean',
            'price' => 'decimal:2',
            'delivery_days' => 'integer',
            'revisions' => 'integer',
            'expires_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(PortfolioSubCategory::class, 'sub_category_id');
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(OfferMilestone::class)->orderBy('sort_order');
    }
}
