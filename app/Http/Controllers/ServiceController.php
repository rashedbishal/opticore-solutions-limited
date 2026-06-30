<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CategoryPortfolioItem;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function show(string $slug): Response
    {
        $serviceData = Cache::remember("categories.service-page.{$slug}", now()->addMinutes(60), function () use ($slug) {
            $category = Category::where('slug', $slug)
                ->where('is_active', true)
                ->with('portfolioItems')
                ->firstOrFail();

            return $this->present($category);
        });

        return Inertia::render('Services/Show', [
            'service' => $serviceData,
            'meta' => [
                'title' => "{$serviceData['name']} — Opticore Solutions Ltd.",
                'description' => $serviceData['shortDescription'],
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
