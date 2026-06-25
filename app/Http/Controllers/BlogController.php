<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\Category;
use Illuminate\Support\Facades\Cache;
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
        $dbBlogs = Cache::remember('blog.index', now()->addMinutes(60), function () {
            return Blog::latest()->get()->map(function ($blog) {
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
            })->values()->toArray();
        });

        return Inertia::render('Blogs/Index', [
            'dbBlogs' => $dbBlogs,
            'categories' => array_values(array_column(Category::configShape(), 'label')),
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
        $formattedBlog = Cache::remember("blog.show.{$slug}", now()->addMinutes(60), function () use ($slug) {
            $blog = Blog::where('slug', $slug)->firstOrFail();

            return [
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
        });

        return Inertia::render('Blogs/Show', [
            'slug' => $slug,
            'dbBlog' => $formattedBlog,
            'meta' => [
                'title' => $formattedBlog['title'].' — Opticore Solutions Ltd.',
                'description' => Str::limit(strip_tags($formattedBlog['content']), 150),
            ],
        ]);
    }
}
