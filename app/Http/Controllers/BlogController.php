<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    /**
     * Display the blog listing page.
     */
    public function index(): Response
    {
        $dbBlogs = Blog::latest()->get()->map(function ($blog) {
            return [
                'id' => (string) $blog->id,
                'title' => $blog->title,
                'slug' => $blog->slug,
                'excerpt' => $blog->excerpt ?? substr($blog->content, 0, 120).'...',
                'content' => $blog->content,
                'category' => $blog->category,
                'author' => $blog->author ?? 'Opticore Team',
                'readTime' => $blog->read_time ?? '5 min read',
                'publishedAt' => $blog->created_at->format('M j, Y'),
                'image' => $blog->image ?? 'https://placehold.co/800x600/111111/7C3AED?text=Opticore',
            ];
        });

        return Inertia::render('Blogs/Index', [
            'dbBlogs' => $dbBlogs,
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
        $blog = Blog::where('slug', $slug)->firstOrFail();

        $formattedBlog = [
            'id' => (string) $blog->id,
            'title' => $blog->title,
            'slug' => $blog->slug,
            'excerpt' => $blog->excerpt,
            'content' => $blog->content,
            'category' => $blog->category,
            'author' => $blog->author ?? 'Opticore Team',
            'readTime' => $blog->read_time ?? '5 min read',
            'publishedAt' => $blog->created_at->format('M j, Y'),
            'image' => $blog->image ?? 'https://placehold.co/800x600/111111/7C3AED?text=Opticore',
        ];

        return Inertia::render('Blogs/Show', [
            'slug' => $slug,
            'dbBlog' => $formattedBlog,
            'meta' => [
                'title' => $blog->title.' — Opticore Solutions Ltd.',
                'description' => Str::limit(strip_tags($blog->content), 150),
            ],
        ]);
    }
}
