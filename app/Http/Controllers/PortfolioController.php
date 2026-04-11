<?php

namespace App\Http\Controllers;

use App\Models\Portfolio;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioController extends Controller
{
    public function show(string $type): Response
    {
        /** @var array<string, array{label: string, description: string}> $configCategories */
        $configCategories = config('portfolio.categories', []);

        $portfolios = Portfolio::all();

        $dbPortfolioCategories = [];

        foreach ($configCategories as $slug => $data) {
            $items = $portfolios->where('category', $slug)->map(function (Portfolio $p) {
                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'category' => $p->category,
                    'media_path' => $p->media_path
                        ? asset('storage/'.$p->media_path)
                        : null,
                    'media_type' => $p->media_type ?? 'image',
                    'alt' => $p->alt ?? $p->title,
                ];
            })->values()->toArray();

            $dbPortfolioCategories[] = [
                'title' => $data['label'],
                'description' => $data['description'],
                'type' => $slug,
                'items' => $items,
            ];
        }

        return Inertia::render('Portfolio/Show', [
            'portfolioType' => $type,
            'dbPortfolioCategories' => $dbPortfolioCategories,
            'meta' => [
                'title' => 'Portfolio — Opticore Solutions Ltd.',
                'description' => 'Selected portfolio work from Opticore Solutions Ltd. across graphic design, digital marketing, video editing, 3D production, and web development.',
            ],
        ]);
    }

    public function preview(Portfolio $portfolio): Response
    {
        return Inertia::render('Portfolio/Preview', [
            'item' => [
                'id' => $portfolio->id,
                'title' => $portfolio->title,
                'category' => $portfolio->category,
                'media_path' => $portfolio->media_path
                    ? asset('storage/'.$portfolio->media_path)
                    : null,
                'media_type' => $portfolio->media_type ?? 'image',
                'alt' => $portfolio->alt ?? $portfolio->title,
            ],
        ]);
    }
}
