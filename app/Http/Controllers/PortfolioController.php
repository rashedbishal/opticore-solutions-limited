<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PortfolioController extends Controller
{
    public function show(string $type): Response
    {
        return Inertia::render('Portfolio/Show', [
            'portfolioType' => $type,
            'meta' => [
                'title' => 'Portfolio — Opticore Solutions Ltd.',
                'description' => 'Selected portfolio work from Opticore Solutions Ltd. across identity, packaging, print, social, and editing.',
            ],
        ]);
    }
}
