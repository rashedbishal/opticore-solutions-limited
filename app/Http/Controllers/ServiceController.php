<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CategoryPortfolioItem;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function show(string $slug): Response
    {
        $category = Category::where('slug', $slug)->where('is_active', true)->firstOrFail();

        return Inertia::render('Services/Show', [
            'service' => $this->present($category),
            'meta' => [
                'title' => "{$category->label} — Opticore Solutions Ltd.",
                'description' => $category->description,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Category $category): array
    {
        return [
            'name' => $category->label,
            'shortDescription' => $category->description,
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
}
