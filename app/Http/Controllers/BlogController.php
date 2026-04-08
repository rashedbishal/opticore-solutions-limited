<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    /**
     * Display the blog listing page.
     */
    public function index(): Response
    {
        return Inertia::render('Blogs/Index', [
            'meta' => [
                'title' => 'Blog — Opticore Solutions Ltd.',
                'description' => 'Read the latest insights on design, tech, and marketing from the Opticore team.',
            ],
        ]);
    }

    /**
     * Display a single blog post.
     */
    public function show(string $slug): Response
    {
        // Meta will be handled by the component for dynamic titles,
        // but we provide a default meta to avoid null issues in layout.
        return Inertia::render('Blogs/Show', [
            'slug' => $slug,
            'meta' => [
                'title' => 'Blog Post — Opticore Solutions Ltd.',
                'description' => 'Read a detailed blog post from the Opticore team.',
            ],
        ]);
    }
}
