<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PortfolioSubCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_slug',
        'name',
        'slug',
        'description',
        'sort_order',
    ];

    /**
     * Get all portfolios belonging to this sub-category.
     */
    public function portfolios(): HasMany
    {
        return $this->hasMany(Portfolio::class, 'sub_category_id');
    }

    /**
     * Route model binding via slug.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
