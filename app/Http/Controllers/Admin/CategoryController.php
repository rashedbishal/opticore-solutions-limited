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
        // Design & creative
        'Palette', 'PenTool', 'Paintbrush', 'Brush', 'Pencil', 'PenLine', 'Wand2', 'Type',
        // Video & media
        'Clapperboard', 'Video', 'Film', 'MonitorPlay', 'Camera', 'ScanLine', 'Play', 'Mic', 'Headphones', 'Radio',
        // Marketing & growth
        'Megaphone', 'Globe', 'Rocket', 'TrendingUp', 'Target', 'BarChart2',
        // Web & digital
        'Smartphone', 'Laptop', 'Monitor', 'Layout', 'AppWindow',
        // 3D & structure
        'Box', 'Layers', 'Layers3', 'BoxSelect', 'Package',
        // Tech
        'Cpu', 'Code2', 'Terminal',
        // General accents
        'Gem', 'Zap', 'Star', 'Lightbulb',
    ];

    /**
     * Color keys mapped to literal Tailwind classes in
     * resources/js/lib/categoryVisuals.ts — keep both lists in sync.
     */
    public const ALLOWED_COLORS = [
        'pink', 'violet', 'emerald', 'orange', 'cyan',
        'blue', 'amber', 'rose', 'teal', 'slate',
        'indigo', 'purple', 'fuchsia', 'red', 'green',
        'sky', 'lime', 'yellow',
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
        $this->flushCategoryCaches($validated['slug']);

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
                'meta_title' => $category->meta_title,
                'meta_description' => $category->meta_description,
                'og_title' => $category->og_title,
                'og_description' => $category->og_description,
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
                'floating_card_enabled' => $category->floating_card_enabled,
                'floating_card_title' => $category->floating_card_title,
                'floating_card_description' => $category->floating_card_description,
                'floating_card_image_url' => $category->floating_card_image
                    ? asset('storage/'.$category->floating_card_image)
                    : null,
                'floating_card_thumb_url' => $category->floating_card_thumb
                    ? asset('storage/'.$category->floating_card_thumb)
                    : null,
                'floating_card_sort_order' => $category->floating_card_sort_order,
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
        $this->flushCategoryCaches($category->slug);

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

        $floatingImage = $category->floating_card_image;
        $floatingThumb = $category->floating_card_thumb !== $category->floating_card_image
            ? $category->floating_card_thumb
            : null;

        $slug = $category->slug;

        $category->delete();

        Storage::disk('public')->delete($imagePaths);

        if ($floatingImage) {
            Storage::disk('public')->delete($floatingImage);
        }
        if ($floatingThumb) {
            Storage::disk('public')->delete($floatingThumb);
        }

        $this->flushCategoryCaches($slug);

        return back()->with('success', 'Category deleted.');
    }

    public function floatingCardImagesStore(Request $request, Category $category): RedirectResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'thumb' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $imagePath = $request->file('image')->store('categories/floating', 'public');

        try {
            $thumbPath = $request->hasFile('thumb')
                ? $request->file('thumb')->store('categories/floating', 'public')
                : null;

            // Delete old images before replacing
            if ($category->floating_card_image) {
                Storage::disk('public')->delete($category->floating_card_image);
            }
            if ($category->floating_card_thumb && $category->floating_card_thumb !== $category->floating_card_image) {
                Storage::disk('public')->delete($category->floating_card_thumb);
            }

            $category->update([
                'floating_card_image' => $imagePath,
                'floating_card_thumb' => $thumbPath,
            ]);

            Cache::forget('categories.floating-cards');
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($imagePath);
            if (isset($thumbPath)) {
                Storage::disk('public')->delete($thumbPath);
            }

            throw $e;
        }

        return back()->with('success', 'Floating card images updated.');
    }

    public function floatingCardImagesDestroy(Category $category): RedirectResponse
    {
        if ($category->floating_card_image) {
            Storage::disk('public')->delete($category->floating_card_image);
        }
        if ($category->floating_card_thumb && $category->floating_card_thumb !== $category->floating_card_image) {
            Storage::disk('public')->delete($category->floating_card_thumb);
        }

        $category->update([
            'floating_card_enabled' => false,
            'floating_card_image' => null,
            'floating_card_thumb' => null,
        ]);

        Cache::forget('categories.floating-cards');

        return back()->with('success', 'Floating card images removed.');
    }

    public function galleryStore(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:4096'],
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

        Cache::forget("categories.service-page.{$category->slug}");

        return back()->with('success', 'Selected Work item added.');
    }

    public function galleryDestroy(Category $category, CategoryPortfolioItem $item): RedirectResponse
    {
        abort_if($item->category_id !== $category->id, 404);

        if (! str_starts_with($item->image, '/') && ! str_starts_with($item->image, 'http')) {
            Storage::disk('public')->delete($item->image);
        }

        $item->delete();

        Cache::forget("categories.service-page.{$category->slug}");

        return back()->with('success', 'Selected Work item removed.');
    }

    private function flushCategoryCaches(?string $slug = null): void
    {
        Cache::forget('categories.config-shape');
        Cache::forget('categories.service-page-links');
        Cache::forget('categories.floating-cards');
        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        Cache::forget('hire-us.subcategories');
        if ($slug !== null) {
            Cache::forget("portfolio.subcategories.{$slug}");
            Cache::forget("categories.service-page.{$slug}");
        }
    }
}
