<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Portfolio;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $categories = [
            'graphic-design',
            'digital-marketing',
            'video-editing',
            '3d-production',
            'web-development',
        ];

        $featuredPortfolios = [];
        foreach ($categories as $category) {
            $items = Portfolio::where('category', $category)
                ->latest()
                ->take(3)
                ->get();

            if ($items->isNotEmpty()) {
                $featuredPortfolios[$category] = $items->map(fn ($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'category' => $item->category,
                    'media_path' => $item->media_path ? asset('storage/'.$item->media_path) : null,
                    'media_type' => $item->media_type ?? 'image',
                    'alt' => $item->alt ?? $item->title,
                ])->toArray();
            } else {
                $featuredPortfolios[$category] = [];
            }
        }

        $brands = Brand::orderBy('created_at', 'asc')->get(['name', 'logo_path'])->toArray();

        return Inertia::render('Home/Index', [
            'featuredPortfolios' => $featuredPortfolios,
            'brands' => $brands,
            'meta' => [
                'title' => 'Opticore Solutions Ltd. — Premium Digital Agency',
                'description' => 'We build brands that leave a lasting impression.',
            ],
        ]);
    }
}
