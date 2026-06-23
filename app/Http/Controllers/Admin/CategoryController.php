<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use App\Models\CategoryPortfolioItem;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /**
     * Lucide icon keys wired into the public `ServicePageTemplate`'s
     * `iconMap` — keep this list in sync with
     * resources/js/components/Services/ServicePageTemplate.tsx so an admin
     * can never pick an icon the public page doesn't know how to render.
     */
    public const ALLOWED_ICONS = [
        'Palette', 'PenTool', 'Paintbrush',
        'Clapperboard', 'Video', 'Film', 'MonitorPlay', 'Camera', 'ScanLine',
        'Megaphone', 'Globe', 'Smartphone',
        'Box', 'Layers', 'BoxSelect', 'Cpu',
        'Code2', 'Terminal',
    ];

    /**
     * Color keys mapped to literal Tailwind classes in
     * resources/js/lib/categoryVisuals.ts — keep both lists in sync.
     */
    public const ALLOWED_COLORS = [
        'pink', 'violet', 'emerald', 'orange', 'cyan',
        'blue', 'amber', 'rose', 'teal', 'slate',
    ];

    public function index(): Response
    {
        return Inertia::render('Admin/Category/Index', [
            'categories' => Category::query()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->paginate(10)
                ->through(fn (Category $category) => [
                    'id' => $category->id,
                    'slug' => $category->slug,
                    'label' => $category->label,
                    'description' => $category->description,
                    'sort_order' => $category->sort_order,
                    'is_active' => $category->is_active,
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Category/Create');
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $base = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['label']);
        $validated['slug'] = $this->uniqueSlug($base);

        Category::create($validated);
        $this->flushCategoryCaches();

        return redirect()->route('admin.categories.index')->with('success', 'Category created.');
    }

    /**
     * Appends a numeric suffix until the slug is unique. Needed because the
     * auto-generated-from-label slug (see Create.tsx) never goes through
     * StoreCategoryRequest's `unique` rule — it's computed after validation.
     */
    private function uniqueSlug(string $base): string
    {
        $slug = $base;
        $suffix = 2;

        while (Category::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    public function edit(Category $category): Response
    {
        $emptyHeading = ['eyebrow' => '', 'title' => ''];

        return Inertia::render('Admin/Category/Edit', [
            'category' => [
                'id' => $category->id,
                'slug' => $category->slug,
                'label' => $category->label,
                'description' => $category->description,
                'sort_order' => $category->sort_order,
                'icon' => $category->icon,
                'color' => $category->color,
                'long_description' => $category->long_description,
                'is_active' => $category->is_active,
                'headings' => [
                    'capabilities' => $category->headings['capabilities'] ?? $emptyHeading,
                    'whyOpticore' => $category->headings['whyOpticore'] ?? $emptyHeading,
                    'process' => $category->headings['process'] ?? $emptyHeading,
                    'selectedWork' => $category->headings['selectedWork'] ?? $emptyHeading,
                ],
                'sub_services' => $category->sub_services ?? [],
                'reasons' => $category->reasons ?? [],
                'process' => $category->process ?? [],
                'portfolio_items' => $category->portfolioItems->map(fn (CategoryPortfolioItem $item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'category' => $item->category,
                    'description' => $item->description,
                    'alt' => $item->alt,
                    'image_url' => str_starts_with($item->image, '/') || str_starts_with($item->image, 'http')
                        ? $item->image
                        : asset('storage/'.$item->image),
                ])->values(),
            ],
            'allowed_icons' => self::ALLOWED_ICONS,
            'allowed_colors' => self::ALLOWED_COLORS,
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $validated = $request->validated();

        // Shallow-merge by section instead of replacing the whole column, so
        // a partial payload (e.g. a direct API call missing a section) can
        // never silently wipe out the other three headings sections. Each
        // section is still fully replaced as a unit — that matches how the
        // edit form always submits a section's eyebrow + title together.
        if (array_key_exists('headings', $validated)) {
            $validated['headings'] = array_replace($category->headings ?? [], $validated['headings'] ?? []);
        }

        $category->update($validated);
        $this->flushCategoryCaches();

        return redirect()->route('admin.categories.index')->with('success', 'Category updated.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $inUse = PortfolioSubCategory::where('category_slug', $category->slug)->exists()
            || Portfolio::where('category', $category->slug)->exists();

        if ($inUse) {
            return back()->with('error', 'Cannot delete a category that still has sub-categories or portfolio items.');
        }

        // Collect paths before deleting so a failed DB delete never leaves
        // gallery files removed while their DB rows still exist — the DB
        // delete (which cascades CategoryPortfolioItem via FK) runs first;
        // file cleanup is best-effort afterward.
        $imagePaths = $category->portfolioItems
            ->reject(fn (CategoryPortfolioItem $item) => str_starts_with($item->image, '/') || str_starts_with($item->image, 'http'))
            ->pluck('image')
            ->all();

        $category->delete();

        Storage::disk('public')->delete($imagePaths);

        $this->flushCategoryCaches();

        return back()->with('success', 'Category deleted.');
    }

    public function galleryStore(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'max:4096'],
            'title' => ['required', 'string', 'max:100'],
            'category' => ['required', 'string', 'max:60'],
            'description' => ['nullable', 'string', 'max:500'],
            'alt' => ['nullable', 'string', 'max:150'],
        ]);

        $path = $request->file('image')->store('categories', 'public');

        try {
            $category->portfolioItems()->create([
                'title' => $validated['title'],
                'category' => $validated['category'],
                'description' => $validated['description'] ?? null,
                'alt' => $validated['alt'] ?? $validated['title'],
                'image' => $path,
                'sort_order' => ($category->portfolioItems()->max('sort_order') ?? 0) + 10,
            ]);
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($path);

            throw $e;
        }

        return back()->with('success', 'Selected Work item added.');
    }

    public function galleryDestroy(Category $category, CategoryPortfolioItem $item): RedirectResponse
    {
        abort_if($item->category_id !== $category->id, 404);

        if (! str_starts_with($item->image, '/') && ! str_starts_with($item->image, 'http')) {
            Storage::disk('public')->delete($item->image);
        }

        $item->delete();

        return back()->with('success', 'Selected Work item removed.');
    }

    private function flushCategoryCaches(): void
    {
        Cache::forget('categories.config-shape');
        Cache::forget('categories.service-page-links');
        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        Cache::forget('hire-us.subcategories');
    }
}
