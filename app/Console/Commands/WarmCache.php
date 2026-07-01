<?php

namespace App\Console\Commands;

use App\Http\Controllers\SitemapController;
use App\Models\Blog;
use App\Models\Brand;
use App\Models\Category;
use App\Models\CategoryPortfolioItem;
use App\Models\Faq;
use App\Models\JobListing;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use App\Models\Testimonial;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class WarmCache extends Command
{
    protected $signature = 'cache:warm';

    protected $description = 'Pre-populate all public-facing Redis caches to eliminate cold-hit TTFB spikes';

    public function handle(): int
    {
        $this->line('Warming caches...');

        // 1. Core category config — used on every Inertia page via shared props
        Cache::forget('categories.config-shape');
        $categories = Category::configShape();
        $this->line('  ✓ categories.config-shape');

        // 2. Category floating cards (homepage hero)
        Cache::forget('categories.floating-cards');
        Category::floatingCards();
        $this->line('  ✓ categories.floating-cards');

        // 3. Homepage — featured portfolios, brands, testimonials
        $this->warmHome($categories);

        // 4. Per-slug service pages
        $this->warmServicePages($categories);

        // 5. Portfolio index
        $this->warmPortfolioIndex($categories);

        // 6. Portfolio subcategory caches (per category)
        $this->warmPortfolioSubcategories($categories);

        // 7. Hire Us subcategory listing
        $this->warmHireUs($categories);

        // 8. Blog index
        $this->warmBlogIndex();

        // 9. Static CMS pages
        $this->warmStaticPages();

        // 10. Sitemap
        $this->warmSitemap($categories);

        $this->info('Cache warm-up complete.');

        return self::SUCCESS;
    }

    /** @param array<string, mixed> $categories */
    private function warmHome(array $categories): void
    {
        $slugs = array_keys($categories);

        Cache::forget('home.featuredPortfolios');
        Cache::remember('home.featuredPortfolios', now()->addMinutes(60), function () use ($slugs) {
            $grouped = Portfolio::whereIn('category', $slugs)
                ->latest()
                ->get(['id', 'title', 'category', 'media_path', 'media_type', 'alt'])
                ->groupBy('category');

            $portfolios = [];
            foreach ($slugs as $slug) {
                $portfolios[$slug] = ($grouped->get($slug) ?? collect())
                    ->take(3)
                    ->map(fn ($item) => [
                        'id' => $item->id,
                        'title' => $item->title,
                        'category' => $item->category,
                        'media_path' => $item->media_path ? asset('storage/'.$item->media_path) : null,
                        'media_type' => $item->media_type ?? 'image',
                        'alt' => $item->alt ?? $item->title,
                    ])
                    ->values()
                    ->toArray();
            }

            return $portfolios;
        });

        Cache::forget('home.brands');
        Cache::remember('home.brands', now()->addMinutes(60), function () {
            return Brand::orderBy('created_at', 'asc')->get(['name', 'logo_path'])->toArray();
        });

        Cache::forget('home.testimonials');
        Cache::remember('home.testimonials', now()->addMinutes(60), function () {
            return Testimonial::where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(fn (Testimonial $t) => [
                    'id' => (string) $t->id,
                    'name' => $t->name,
                    'company' => $t->company,
                    'role' => $t->role,
                    'rating' => $t->rating,
                    'comment' => $t->comment,
                    'image' => $t->image_path ? asset('storage/'.$t->image_path) : null,
                ])
                ->toArray();
        });

        $this->line('  ✓ home.featuredPortfolios, home.brands, home.testimonials');
    }

    /** @param array<string, mixed> $categories */
    private function warmServicePages(array $categories): void
    {
        $activeCategories = Category::whereIn('slug', array_keys($categories))
            ->where('is_active', true)
            ->with('portfolioItems')
            ->get();

        foreach ($activeCategories as $category) {
            $key = "categories.service-page.{$category->slug}";
            Cache::forget($key);
            Cache::remember($key, now()->addMinutes(60), fn () => $this->presentCategory($category));
        }

        $this->line("  ✓ categories.service-page.* ({$activeCategories->count()} slugs)");
    }

    private function presentCategory(Category $category): array
    {
        return [
            'name' => $category->label,
            'shortDescription' => $category->description,
            'metaTitle' => $category->meta_title,
            'metaDescription' => $category->meta_description,
            'ogTitle' => $category->og_title,
            'ogDescription' => $category->og_description,
            'longDescription' => $category->long_description,
            'href' => '/'.$category->slug,
            'icon' => $category->icon,
            'subServices' => $category->sub_services ?? [],
            'headings' => $category->headings,
            'reasons' => $category->reasons ?? [],
            'process' => $category->process ?? [],
            'portfolio' => $category->portfolioItems->map(fn (CategoryPortfolioItem $item) => [
                'title' => $item->title,
                'category' => $item->category,
                'description' => $item->description,
                'alt' => $item->alt,
                'image' => str_starts_with($item->image, '/') || str_starts_with($item->image, 'http')
                    ? $item->image
                    : asset('storage/'.$item->image),
            ])->values(),
        ];
    }

    /** @param array<string, mixed> $categories */
    private function warmPortfolioIndex(array $categories): void
    {
        Cache::forget('portfolio.categories.index');
        Cache::remember('portfolio.categories.index', now()->addMinutes(60), function () use ($categories) {
            $subCategoryCounts = PortfolioSubCategory::query()
                ->selectRaw('category_slug, COUNT(*) as aggregate')
                ->groupBy('category_slug')
                ->pluck('aggregate', 'category_slug');

            $portfolioCounts = Portfolio::query()
                ->selectRaw('category, COUNT(*) as aggregate')
                ->groupBy('category')
                ->pluck('aggregate', 'category');

            return collect($categories)
                ->map(fn (array $data, string $slug) => [
                    'slug' => $slug,
                    'label' => $data['label'],
                    'description' => $data['description'],
                    'sub_categories_count' => (int) ($subCategoryCounts[$slug] ?? 0),
                    'portfolios_count' => (int) ($portfolioCounts[$slug] ?? 0),
                ])
                ->values()
                ->toArray();
        });

        $this->line('  ✓ portfolio.categories.index');
    }

    /** @param array<string, mixed> $categories */
    private function warmPortfolioSubcategories(array $categories): void
    {
        $allSubCategories = PortfolioSubCategory::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->groupBy('category_slug');

        $count = 0;
        foreach (array_keys($categories) as $slug) {
            $key = "portfolio.subcategories.{$slug}";
            Cache::forget($key);
            Cache::remember($key, now()->addMinutes(60), function () use ($slug, $allSubCategories) {
                return ($allSubCategories->get($slug) ?? collect())
                    ->map(fn (PortfolioSubCategory $sc) => [
                        'id' => $sc->id,
                        'name' => $sc->name,
                        'slug' => $sc->slug,
                        'description' => $sc->description,
                        'meta_title' => $sc->meta_title,
                        'meta_description' => $sc->meta_description,
                        'og_title' => $sc->og_title,
                        'og_description' => $sc->og_description,
                        'image' => $sc->image ? asset('storage/'.$sc->image) : null,
                    ])
                    ->values()
                    ->toArray();
            });
            $count++;
        }

        $this->line("  ✓ portfolio.subcategories.* ({$count} categories)");
    }

    /** @param array<string, mixed> $categories */
    private function warmHireUs(array $categories): void
    {
        Cache::forget('hire-us.subcategories');
        Cache::remember('hire-us.subcategories', now()->addMinutes(60), function () use ($categories) {
            $groupedSubCategories = PortfolioSubCategory::query()
                ->orderBy('category_slug')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->groupBy('category_slug');

            return collect(array_keys($categories))
                ->mapWithKeys(function (string $categorySlug) use ($groupedSubCategories) {
                    $subCategories = ($groupedSubCategories->get($categorySlug) ?? collect())
                        ->map(fn (PortfolioSubCategory $sc) => [
                            'name' => $sc->name,
                            'slug' => $sc->slug,
                            'price' => $sc->price ?: 'Custom Quote',
                            'rating' => $sc->rating !== null ? (float) $sc->rating : 5.0,
                            'reviews' => $sc->reviews_count ?? 0,
                            'image' => $sc->image ? asset('storage/'.$sc->image) : 'https://placehold.co/800x600/111111/FFFFFF?text=Opticore',
                        ])
                        ->values()
                        ->toArray();

                    return [$categorySlug => $subCategories];
                })
                ->toArray();
        });

        Cache::forget('hire-us.recommended-pool');
        Cache::remember('hire-us.recommended-pool', now()->addMinutes(10), function () use ($categories) {
            return PortfolioSubCategory::query()
                ->whereIn('category_slug', array_keys($categories))
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'category_slug', 'image', 'price', 'rating', 'reviews_count'])
                ->toArray();
        });

        $this->line('  ✓ hire-us.subcategories, hire-us.recommended-pool');
    }

    private function warmBlogIndex(): void
    {
        Cache::forget('blog.index');
        Cache::remember('blog.index', now()->addMinutes(60), function () {
            return Blog::latest()->get()->map(function ($blog) {
                return [
                    'id' => (string) $blog->id,
                    'title' => $blog->title,
                    'slug' => $blog->slug,
                    'excerpt' => $blog->excerpt ?? substr($blog->content, 0, 120).'...',
                    'content' => $blog->content,
                    'category' => $blog->category,
                    'author' => $blog->author ?? 'Opticore Team',
                    'readTime' => $blog->read_time ?? '5 min read',
                    'publishedAt' => $blog->created_at->format('M j, Y'),
                    'imageUrl' => $blog->image_url,
                ];
            })->toArray();
        });

        $this->line('  ✓ blog.index');
    }

    /** @param array<string, mixed> $categories */
    private function warmSitemap(array $categories): void
    {
        Cache::forget('sitemap.xml');
        // Delegate to the controller's build logic by booting it through the app.
        app(SitemapController::class)->index();
        $this->line('  ✓ sitemap.xml');
    }

    private function warmStaticPages(): void
    {
        Cache::forget('career.jobListings');
        Cache::remember('career.jobListings', now()->addMinutes(60), fn () => JobListing::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['title', 'location', 'type', 'description'])
            ->toArray());

        Cache::forget('faq.items');
        Cache::remember('faq.items', now()->addMinutes(60), fn () => Faq::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['question', 'answer'])
            ->toArray());

        $this->line('  ✓ career.jobListings, faq.items');
    }
}
