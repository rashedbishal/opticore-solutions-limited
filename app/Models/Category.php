<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'label',
        'description',
        'sort_order',
        'icon',
        'long_description',
        'headings',
        'sub_services',
        'reasons',
        'process',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'headings' => 'array',
            'sub_services' => 'array',
            'reasons' => 'array',
            'process' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function portfolioItems(): HasMany
    {
        return $this->hasMany(CategoryPortfolioItem::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Cached category list keyed by slug, in the same shape as the former
     * config('portfolio.categories') array.
     *
     * @return array<string, array{label: string, description: string|null}>
     */
    public static function configShape(): array
    {
        return Cache::remember('categories.config-shape', now()->addMinutes(60), function () {
            return self::query()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->mapWithKeys(fn (Category $category) => [
                    $category->slug => [
                        'label' => $category->label,
                        'description' => $category->description,
                    ],
                ])
                ->toArray();
        });
    }

    /**
     * Cached, ordered list of active categories with a live marketing page,
     * in the shape the footer needs: `{slug, name, href}`.
     *
     * @return array<int, array{slug: string, name: string, href: string}>
     */
    public static function servicePageLinks(): array
    {
        return Cache::remember('categories.service-page-links', now()->addMinutes(60), function () {
            return self::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(fn (Category $category) => [
                    'slug' => $category->slug,
                    'name' => $category->label,
                    'href' => '/'.$category->slug,
                ])
                ->values()
                ->toArray();
        });
    }
}
