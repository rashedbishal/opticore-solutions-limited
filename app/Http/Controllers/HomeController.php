<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $categories = [
            'graphic-design',
            'digital-marketing',
            '3d-production',
            'web-development',
        ];

        $featuredPortfolios = [];
        foreach ($categories as $category) {
            $item = \App\Models\Portfolio::where('category', $category)->first();
            if ($item) {
                $featuredPortfolios[$category] = [
                    'id' => $item->id,
                    'title' => $item->title,
                    'category' => $item->category,
                    'media_path' => $item->media_path ? asset('storage/' . $item->media_path) : null,
                    'media_type' => $item->media_type ?? 'image',
                    'alt' => $item->alt ?? $item->title,
                ];
            } else {
                $featuredPortfolios[$category] = null;
            }
        }

        return Inertia::render('Home/Index', [
            'featuredPortfolios' => $featuredPortfolios,
            'meta' => [
                'title' => 'Opticore Solutions Ltd. — Premium Digital Agency',
                'description' => 'We build brands that leave a lasting impression.',
            ],
        ]);
    }
}
