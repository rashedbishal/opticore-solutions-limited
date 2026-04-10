<?php

namespace App\Http\Controllers;

use App\Models\Portfolio;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioController extends Controller
{
    public function show(string $type): Response
    {
        $portfolios = Portfolio::all();

        // Reconstruct the exact shape expected by the frontend
        $categoriesMap = [
            'logo-identity' => ['title' => 'Logo & Identity', 'description' => 'Brand marks and identity systems that command attention and communicate core values instantly.'],
            'packaging-design' => ['title' => 'Packaging Design', 'description' => 'Tactile, premium packaging structures and graphics that elevate product value on the shelf.'],
            'social-media-graphics' => ['title' => 'Social Media Graphics', 'description' => 'High-conversion thumb-stopping visual assets engineered for modern feeds and algorithms.'],
            'print-design' => ['title' => 'Print Design', 'description' => 'Editorial layouts, corporate collateral, and large-format graphics constructed with typographical rigor.'],
            'photoshop-editing' => ['title' => 'Photoshop Editing', 'description' => 'Advanced compositing, high-end retouching, and hyper-realistic manipulation for commercial use.']
        ];

        $dbPortfolioCategories = [];

        foreach ($categoriesMap as $catType => $data) {
            $items = $portfolios->where('category', $catType)->map(function($p) {
                return [
                    'title' => $p->title,
                    'category' => $p->category,
                    'image' => $p->image ?? 'https://placehold.co/600x400/111111/7C3AED?text=Opticore',
                    'alt' => $p->alt ?? $p->title
                ];
            })->values()->toArray();

            $dbPortfolioCategories[] = [
                'title' => $data['title'],
                'description' => $data['description'],
                'type' => $catType,
                'items' => $items
            ];
        }

        return Inertia::render('Portfolio/Show', [
            'portfolioType' => $type,
            'dbPortfolioCategories' => $dbPortfolioCategories,
            'meta' => [
                'title' => 'Portfolio — Opticore Solutions Ltd.',
                'description' => 'Selected portfolio work from Opticore Solutions Ltd. across identity, packaging, print, social, and editing.',
            ],
        ]);
    }
}
