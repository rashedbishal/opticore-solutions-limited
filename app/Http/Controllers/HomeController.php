<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Portfolio;
use App\Models\Testimonial;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $categories = array_keys(Category::configShape());

        $featuredPortfolios = Cache::remember('home.featuredPortfolios', now()->addMinutes(60), function () use ($categories) {
            $grouped = Portfolio::whereIn('category', $categories)
                ->latest()
                ->get(['id', 'title', 'category', 'media_path', 'media_type', 'alt'])
                ->groupBy('category');

            $portfolios = [];
            foreach ($categories as $category) {
                $portfolios[$category] = ($grouped->get($category) ?? collect())
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

        $brands = Cache::remember('home.brands', now()->addMinutes(60), function () {
            return Brand::orderBy('created_at', 'asc')->get(['name', 'logo_path'])->toArray();
        });

        $testimonials = Cache::remember('home.testimonials', now()->addMinutes(60), function () {
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

        return Inertia::render('Home/Index', [
            'featuredPortfolios' => $featuredPortfolios,
            'brands' => $brands,
            'testimonials' => $testimonials,
            'floatingCards' => Category::floatingCards(),
            'meta' => [
                'title' => 'Home — Opticore Solutions Limited',
                'description' => 'From graphic design to web development, Opticore Solutions Limited creates premium digital experiences that help brands grow.',
            ],
        ]);
    }
}
