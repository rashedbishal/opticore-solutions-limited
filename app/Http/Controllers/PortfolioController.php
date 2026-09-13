<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioController extends Controller
{
    /**
     * Show the portfolio landing page with category cards.
     */
    public function index(): Response
    {
        return Inertia::render('Portfolio/Show', [
            'categories' => Category::portfolioIndex(),
            'meta' => [
                'title' => 'Portfolio',
                'ogTitle' => null,
                'description' => 'Browse our creative categories and explore sub-category specific work across branding, digital, video, 3D, and web.',
                'ogDescription' => null,
            ],
        ]);
    }

    /**
     * Show a category page with sub-category tabs and portfolio items.
     */
    public function showCategory(string $category): Response
    {
        $configCategories = $this->portfolioCategories();
        $categoryData = $configCategories[$category] ?? null;

        abort_unless($categoryData !== null, 404);

        $subCategories = $this->subCategoriesFor($category);
        $selectedSubCategory = $subCategories[0] ?? null;

        return $this->renderCategoryPage($category, $categoryData, $subCategories, $selectedSubCategory, false);
    }

    /**
     * Show a category page with the requested sub-category selected.
     */
    public function showSubCategory(string $category, PortfolioSubCategory $subcategory): Response
    {
        $configCategories = $this->portfolioCategories();
        $categoryData = $configCategories[$category] ?? null;

        abort_unless($categoryData !== null && $subcategory->category_slug === $category, 404);

        $subCategories = $this->subCategoriesFor($category);
        $selectedSubCategory = collect($subCategories)
            ->firstWhere('slug', $subcategory->slug);

        abort_unless($selectedSubCategory !== null, 404);

        return $this->renderCategoryPage($category, $categoryData, $subCategories, $selectedSubCategory, true);
    }

    /**
     * Full-screen preview for a single portfolio item.
     */
    public function preview(Portfolio $portfolio): Response
    {
        $portfolio->loadMissing('subCategory');

        $subCategory = $portfolio->subCategory;
        $categorySlug = $subCategory?->category_slug ?? $portfolio->category;
        $subCategorySlug = $subCategory?->slug;

        return Inertia::render('Portfolio/Preview', [
            'item' => [
                'id' => $portfolio->id,
                'title' => $portfolio->title,
                'category_slug' => $categorySlug,
                'subcategory_slug' => $subCategorySlug,
                'media_path' => $portfolio->media_path
                    ? asset('storage/'.$portfolio->media_path)
                    : null,
                'media_type' => $portfolio->media_type ?? 'image',
                'youtube_video_id' => $portfolio->youtube_video_id,
                'alt' => $portfolio->alt ?? $portfolio->title,
            ],
        ]);
    }

    /**
     * @return array<string, array{label: string, description: string}>
     */
    private function portfolioCategories(): array
    {
        return Category::configShape();
    }

    /**
     * @return array<int, array{id: int, name: string, slug: string, description: string|null, portfolios_count: int}>
     */
    private function subCategoriesFor(string $category): array
    {
        return Cache::remember("portfolio.subcategories.{$category}", now()->addMinutes(60), function () use ($category) {
            return PortfolioSubCategory::query()
                ->where('category_slug', $category)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->withCount('portfolios')
                ->get()
                ->map(fn (PortfolioSubCategory $subCategory) => [
                    'id' => $subCategory->id,
                    'name' => $subCategory->name,
                    'slug' => $subCategory->slug,
                    'description' => $subCategory->description,
                    'meta_title' => $subCategory->meta_title,
                    'meta_description' => $subCategory->meta_description,
                    'og_title' => $subCategory->og_title,
                    'og_description' => $subCategory->og_description,
                    'portfolios_count' => $subCategory->portfolios_count,
                ])
                ->values()
                ->toArray();
        });
    }

    /**
     * @param  array{label: string, description: string}  $categoryData
     * @param  array<int, array{id: int, name: string, slug: string, description: string|null, portfolios_count: int}>  $subCategories
     * @param  array{id: int, name: string, slug: string, description: string|null, portfolios_count: int}|null  $selectedSubCategory
     */
    private function renderCategoryPage(
        string $category,
        array $categoryData,
        array $subCategories,
        ?array $selectedSubCategory,
        bool $isSubCategoryUrl = false,
    ): Response {
        $portfolios = collect();

        if ($selectedSubCategory !== null) {
            $portfolios = Portfolio::query()
                ->where('sub_category_id', $selectedSubCategory['id'])
                ->latest()
                ->take(50)
                ->get()
                ->map(fn (Portfolio $portfolio) => [
                    'id' => $portfolio->id,
                    'title' => $portfolio->title,
                    'media_path' => $portfolio->media_path ? asset('storage/'.$portfolio->media_path) : null,
                    'media_type' => $portfolio->media_type ?? 'image',
                    'youtube_video_id' => $portfolio->youtube_video_id,
                    'alt' => $portfolio->alt ?? $portfolio->title,
                ]);
        }

        return Inertia::render('Portfolio/CategoryShow', [
            'category' => [
                'slug' => $category,
                'label' => $categoryData['label'],
                'description' => $categoryData['description'],
            ],
            'subCategories' => $subCategories,
            'selectedSubCategory' => $selectedSubCategory,
            'portfolios' => $portfolios->values()->toArray(),
            'meta' => [
                'title' => $isSubCategoryUrl && $selectedSubCategory !== null
                    ? ($selectedSubCategory['meta_title'] ?? $selectedSubCategory['name'])
                    : ($categoryData['meta_title'] ?? $categoryData['label']),
                'ogTitle' => $isSubCategoryUrl && $selectedSubCategory !== null
                    ? ($selectedSubCategory['og_title'] ?? null)
                    : ($categoryData['og_title'] ?? null),
                'description' => $isSubCategoryUrl && $selectedSubCategory !== null
                    ? ($selectedSubCategory['meta_description'] ?? $selectedSubCategory['description'] ?? $categoryData['description'])
                    : ($categoryData['meta_description'] ?? $categoryData['description']),
                'ogDescription' => $isSubCategoryUrl && $selectedSubCategory !== null
                    ? ($selectedSubCategory['og_description'] ?? null)
                    : ($categoryData['og_description'] ?? null),
            ],
        ]);
    }
}
