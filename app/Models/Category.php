<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'label',
        'description',
        'meta_title',
        'meta_description',
        'og_title',
        'og_description',
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

    /**
     * @return HasMany<CategoryPortfolioItem, $this>
     */
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
                        'meta_title' => $category->meta_title,
                        'meta_description' => $category->meta_description,
                        'og_title' => $category->og_title,
                        'og_description' => $category->og_description,
                        'icon' => $category->icon,
                        'color' => $category->color,
                        'is_active' => $category->is_active,
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
     * Cached category cards for the public `/portfolio` landing page.
     * Cover order: floating-card image, then Selected Work gallery, then
     * latest exhibit stills — so the cards stay visual even when a
     * dedicated cover hasn't been uploaded yet.
     *
     * @return array<int, array{slug: string, label: string, description: string|null, icon: string|null, color: string|null, cover: string|null, previews: list<string>, sub_categories_count: int, portfolios_count: int}>
     */
    public static function portfolioIndex(): array
    {
        return Cache::remember('portfolio.categories.index', now()->addMinutes(60), function () {
            $configCategories = self::configShape();
            $slugs = array_keys($configCategories);

            $subCategoryCounts = PortfolioSubCategory::query()
                ->selectRaw('category_slug, COUNT(*) as aggregate')
                ->groupBy('category_slug')
                ->pluck('aggregate', 'category_slug');

            $portfolioCounts = Portfolio::query()
                ->selectRaw('category, COUNT(*) as aggregate')
                ->groupBy('category')
                ->pluck('aggregate', 'category');

            $models = self::query()
                ->whereIn('slug', $slugs)
                ->with('portfolioItems')
                ->get()
                ->keyBy('slug');

            $exhibits = Portfolio::query()
                ->whereIn('category', $slugs)
                ->whereNotNull('media_path')
                ->latest()
                ->get(['category', 'media_path', 'media_type', 'alt', 'title'])
                ->groupBy('category');

            return collect($configCategories)
                ->map(function (array $data, string $slug) use ($models, $subCategoryCounts, $portfolioCounts, $exhibits) {
                    $visuals = self::cardVisuals(
                        $models->get($slug),
                        $exhibits->get($slug) ?? collect(),
                    );

                    return [
                        'slug' => $slug,
                        'label' => $data['label'],
                        'description' => $data['description'],
                        'icon' => $data['icon'] ?? null,
                        'color' => $data['color'] ?? null,
                        'cover' => $visuals['cover'],
                        'previews' => $visuals['previews'],
                        'sub_categories_count' => (int) ($subCategoryCounts[$slug] ?? 0),
                        'portfolios_count' => (int) ($portfolioCounts[$slug] ?? 0),
                    ];
                })
                ->values()
                ->toArray();
        });
    }

    /**
     * @param  Collection<int, Portfolio>  $exhibits
     * @return array{cover: string|null, previews: list<string>}
     */
    private static function cardVisuals(?self $category, Collection $exhibits): array
    {
        $images = [];

        if ($category?->floating_card_image) {
            $images[] = self::publicMediaUrl($category->floating_card_image);
        } elseif ($category?->floating_card_thumb) {
            $images[] = self::publicMediaUrl($category->floating_card_thumb);
        }

        if ($category !== null) {
            foreach ($category->portfolioItems as $item) {
                $url = self::publicMediaUrl($item->image);

                if ($url !== null && ! in_array($url, $images, true)) {
                    $images[] = $url;
                }

                if (count($images) >= 4) {
                    break;
                }
            }
        }

        if (count($images) < 4) {
            foreach ($exhibits as $exhibit) {
                if (($exhibit->media_type ?? 'image') === 'video') {
                    continue;
                }

                $url = self::publicMediaUrl($exhibit->media_path);

                if ($url !== null && ! in_array($url, $images, true)) {
                    $images[] = $url;
                }

                if (count($images) >= 4) {
                    break;
                }
            }
        }

        $images = array_values(array_filter($images));

        return [
            'cover' => $images[0] ?? null,
            'previews' => array_slice($images, 1, 3),
        ];
    }

    private static function publicMediaUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (str_starts_with($path, '/') || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return asset('storage/'.$path);
    }

    /**
     * Cached, ordered list of active categories with a live marketing page,
     * in the shape the footer needs: `{slug, name, href}`.
     *
     * @return array<int, array{slug: string, name: string, href: string}>
     */
    public static function servicePageLinks(): array
    {
        return collect(self::configShape())
            ->filter(fn (array $cat) => $cat['is_active'] ?? false)
            ->map(fn (array $cat, string $slug) => [
                'slug' => $slug,
                'name' => $cat['label'],
                'href' => '/'.$slug,
            ])
            ->values()
            ->toArray();
    }
}
