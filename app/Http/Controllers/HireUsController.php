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
        ]);
    }
}
