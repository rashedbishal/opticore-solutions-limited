<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBlogRequest;
use App\Http\Requests\UpdateBlogRequest;
use App\Models\Blog;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    private function deleteImage(?string $path): void
    {
        if (! $path) {
            return;
        }

        // Clean any full URL or '/storage/' prefix to get the relative public disk path
        $cleanedPath = preg_replace('/^.*\/storage\//', '', $path);
        Storage::disk('public')->delete($cleanedPath);
    }

    /** @return array<int, string> */
    private function categoryOptions(): array
    {
        return array_values(array_column(Category::configShape(), 'label'));
    }

    public function index(): Response
    {
        return Inertia::render('Admin/Blog/Index', [
            'blogs' => Blog::latest()->paginate(10),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Blog/Create', [
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function store(StoreBlogRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $validated['slug'] = Str::slug($validated['title']).'-'.uniqid();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('blogs', 'public');
            $validated['image'] = Storage::url($path);
        }

        $blog = Blog::create($validated);

        Cache::forget('blog.index');
        Cache::forget("blog.show.{$blog->slug}");
        Cache::forget('sitemap.xml');

        return redirect()->route('admin.blogs.index')->with('success', 'Blog created.');
    }

    public function edit(Blog $blog): Response
    {
        return Inertia::render('Admin/Blog/Edit', [
            'blog' => $blog,
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(UpdateBlogRequest $request, Blog $blog): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('image')) {
            // Delete old image
            $this->deleteImage($blog->image);

            $path = $request->file('image')->store('blogs', 'public');
            $validated['image'] = Storage::url($path);
        }

        $blog->update($validated);

        Cache::forget('blog.index');
        Cache::forget("blog.show.{$blog->slug}");
        Cache::forget('sitemap.xml');

        return redirect()->route('admin.blogs.index')->with('success', 'Blog updated.');
    }

    public function destroy(Blog $blog): RedirectResponse
    {
        // Delete associated image
        $this->deleteImage($blog->image);

        $blog->delete();

        Cache::forget('blog.index');
        Cache::forget("blog.show.{$blog->slug}");
        Cache::forget('sitemap.xml');

        return back()->with('success', 'Blog deleted.');
    }
}
