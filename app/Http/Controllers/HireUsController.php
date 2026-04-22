<?php

namespace App\Http\Controllers;

use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use Inertia\Inertia;
use Inertia\Response;

class HireUsController extends Controller
{
    public function showSubCategory(string $category, PortfolioSubCategory $subcategory): Response
    {
        /** @var array<string, array{label: string, description: string}> $configCategories */
        $configCategories = config('portfolio.categories', []);
        $categoryData = $configCategories[$category] ?? null;

        abort_unless($categoryData !== null && $subcategory->category_slug === $category, 404);

        $portfolios = Portfolio::query()
            ->where('sub_category_id', $subcategory->id)
            ->latest()
            ->get()
            ->map(fn (Portfolio $portfolio) => [
                'id' => $portfolio->id,
                'title' => $portfolio->title,
                'media_path' => $portfolio->media_path ? asset('storage/'.$portfolio->media_path) : null,
                'media_type' => $portfolio->media_type ?? 'image',
                'alt' => $portfolio->alt ?? $portfolio->title,
            ])
            ->values()
            ->toArray();

        $siblingSubCategories = PortfolioSubCategory::query()
            ->where('category_slug', $category)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['name', 'slug'])
            ->toArray();

        $recommendedServices = PortfolioSubCategory::query()
            ->where('id', '!=', $subcategory->id)
            ->inRandomOrder()
            ->limit(4)
            ->get(['id', 'name', 'slug', 'category_slug', 'description', 'price', 'rating', 'reviews_count', 'image'])
            ->map(fn (PortfolioSubCategory $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
                'category_slug' => $s->category_slug,
                'category_label' => $configCategories[$s->category_slug]['label'] ?? $s->category_slug,
                'description' => $s->description,
                'price' => $s->price,
                'rating' => $s->rating,
                'reviews_count' => $s->reviews_count,
                'image' => $s->image ? asset('storage/'.$s->image) : null,
            ])
            ->values()
            ->toArray();

        return Inertia::render('HireUs/SubCategoryShow', [
            'category' => [
                'slug' => $category,
                'label' => $categoryData['label'],
            ],
            'subCategory' => [
                'id' => $subcategory->id,
                'name' => $subcategory->name,
                'slug' => $subcategory->slug,
                'description' => $subcategory->description,
            ],
            'portfolios' => $portfolios,
            'siblingSubCategories' => $siblingSubCategories,
            'recommendedServices' => $recommendedServices,
        ]);
    }
}
