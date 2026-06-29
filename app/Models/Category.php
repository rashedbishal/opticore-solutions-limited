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
        'color',
        'long_description',
        'headings',
        'sub_services',
        'reasons',
        'process',
        'is_active',
        'floating_card_enabled',
        'floating_card_title',
        'floating_card_description',
        'floating_card_image',
        'floating_card_thumb',
        'floating_card_sort_order',
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
            'floating_card_enabled' => 'boolean',
            'floating_card_sort_order' => 'integer',
        ];
    }

    public function portfolioItems(): HasMany
    {
        return $this->hasMany(CategoryPortfolioItem::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Cached category list keyed by slug, in the same shape as the former
     * config('portfolio.categories') array. `icon`/`color` are additive —
     * consumers that only destructure `label`/`description` are unaffected.
     *
     * @return array<string, array{label: string, description: string|null, icon: string|null, color: string|null}>
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
                        'icon' => $category->icon,
                        'color' => $category->color,
                    ],
                ])
                ->toArray();
        });
    }

    /**
     * Cached list of categories enabled as homepage floating cards, ordered
     * by `floating_card_sort_order` then `id`. Returns only categories that
     * have both the enabled flag set and an image uploaded.
     *
     * @return array<int, array{id: int, category: string, title: string, description: string, image: string, thumb: string, href: string}>
     */
    public static function floatingCards(): array
    {
        return Cache::remember('categories.floating-cards', now()->addMinutes(60), function () {
            return self::query()
                ->where('floating_card_enabled', true)
                ->whereNotNull('floating_card_image')
                ->orderBy('floating_card_sort_order')
                ->orderBy('id')
                ->get()
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'category' => $category->label,
                    'title' => $category->floating_card_title ?? $category->label,
                    'description' => $category->floating_card_description ?? $category->description ?? '',
                    'image' => asset('storage/'.$category->floating_card_image),
                    'thumb' => $category->floating_card_thumb
                        ? asset('storage/'.$category->floating_card_thumb)
                        : asset('storage/'.$category->floating_card_image),
                    'href' => '/portfolio/'.$category->slug,
                ])
                ->values()
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
