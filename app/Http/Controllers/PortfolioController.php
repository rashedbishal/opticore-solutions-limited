<?php

namespace App\Http\Controllers;

use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioController extends Controller
{
    /**
     * Show sub-categories for the given portfolio category.
     * Route: GET /portfolio/{category}
     */
    public function showCategory(string $category): Response|HttpResponse
    {
        /** @var array<string, array{label: string, description: string}> $configCategories */
        $configCategories = config('portfolio.categories', []);

        if (! array_key_exists($category, $configCategories)) {
            abort(404);
        }

        $categoryData = $configCategories[$category];

        $subCategories = PortfolioSubCategory::where('category_slug', $category)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->withCount('portfolios')
            ->get()
            ->map(fn (PortfolioSubCategory $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
                'description' => $s->description,
                'portfolios_count' => $s->portfolios_count,
            ])
            ->values()
            ->toArray();

        $allCategories = collect($configCategories)->map(fn (array $data, string $slug) => [
            'slug' => $slug,
            'label' => $data['label'],
        ])->values()->toArray();

        return Inertia::render('Portfolio/CategoryShow', [
            'category' => [
                'slug' => $category,
                'label' => $categoryData['label'],
                'description' => $categoryData['description'],
            ],
            'subCategories' => $subCategories,
            'allCategories' => $allCategories,
            'meta' => [
                'title' => $categoryData['label'].' — Opticore Solutions Ltd.',
                'description' => $categoryData['description'],
            ],
        ]);
    }

    /**
     * Show portfolios for the given sub-category.
     * Route: GET /portfolio/{category}/{subcategory}
     */
    public function showSubCategory(string $category, PortfolioSubCategory $subcategory): Response
    {
        /** @var array<string, array{label: string, description: string}> $configCategories */
        $configCategories = config('portfolio.categories', []);

        if (! array_key_exists($category, $configCategories) || $subcategory->category_slug !== $category) {
            abort(404);
        }

        $categoryData = $configCategories[$category];

        $portfolios = $subcategory->portfolios()
            ->latest()
            ->get()
            ->map(fn (Portfolio $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'media_path' => $p->media_path ? asset('storage/'.$p->media_path) : null,
                'media_type' => $p->media_type ?? 'image',
                'alt' => $p->alt ?? $p->title,
            ])
            ->values()
            ->toArray();

        $allCategories = collect($configCategories)->map(fn (array $data, string $slug) => [
            'slug' => $slug,
            'label' => $data['label'],
        ])->values()->toArray();

        $siblingSubCategories = PortfolioSubCategory::where('category_slug', $category)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (PortfolioSubCategory $s) => [
                'name' => $s->name,
                'slug' => $s->slug,
            ])
            ->values()
            ->toArray();

        return Inertia::render('Portfolio/SubCategoryShow', [
            'category' => [
                'slug' => $category,
                'label' => $categoryData['label'],
            ],
            'subCategory' => [
                'slug' => $subcategory->slug,
                'name' => $subcategory->name,
                'description' => $subcategory->description,
            ],
            'portfolios' => $portfolios,
            'allCategories' => $allCategories,
            'siblingSubCategories' => $siblingSubCategories,
            'meta' => [
                'title' => $subcategory->name.' — '.$categoryData['label'].' — Opticore Solutions Ltd.',
                'description' => $subcategory->description ?? $categoryData['description'],
            ],
        ]);
    }

    /**
     * Full-screen preview for a single portfolio item.
     * Route: GET /portfolio-item/{portfolio}
     */
    public function preview(Portfolio $portfolio): Response
    {
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
                'alt' => $portfolio->alt ?? $portfolio->title,
            ],
        ]);
    }
}
