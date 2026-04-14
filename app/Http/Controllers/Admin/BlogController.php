<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function index(): Response
    {
        return Inertia::render('Admin/Blog/Index', [
            'blogs' => Blog::latest()->paginate(10),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Blog/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'excerpt' => 'nullable|string',
            'content' => 'required|string',
            'author' => 'nullable|string|max:255',
            'read_time' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:10240',
        ]);

        $validated['slug'] = Str::slug($validated['title']).'-'.uniqid();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('blogs', 'public');
            $validated['image'] = Storage::url($path);
        }

        Blog::create($validated);

        return redirect()->route('admin.blogs.index')->with('success', 'Blog created.');
    }

    public function edit(Blog $blog): Response
    {
        return Inertia::render('Admin/Blog/Edit', [
            'blog' => $blog,
        ]);
    }

    public function update(Request $request, Blog $blog): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'excerpt' => 'nullable|string',
            'content' => 'required|string',
            'author' => 'nullable|string|max:255',
            'read_time' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:10240',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image
            $this->deleteImage($blog->image);

            $path = $request->file('image')->store('blogs', 'public');
            $validated['image'] = Storage::url($path);
        }

        $blog->update($validated);

        return redirect()->route('admin.blogs.index')->with('success', 'Blog updated.');
    }

    public function destroy(Blog $blog): RedirectResponse
    {
        // Delete associated image
        $this->deleteImage($blog->image);

        $blog->delete();

        return back()->with('success', 'Blog deleted.');
    }
}
