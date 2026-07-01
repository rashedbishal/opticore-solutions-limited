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
        'meta_title',
        'meta_description',
        'og_title',
        'og_description',
        'price',
        'rating',
        'reviews_count',
        'image',
        'sort_order',
        'plans',
        'faqs',
        'description_points',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rating' => 'decimal:1',
            'reviews_count' => 'integer',
            'sort_order' => 'integer',
            'plans' => 'array',
            'faqs' => 'array',
            'description_points' => 'array',
        ];
    }

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
