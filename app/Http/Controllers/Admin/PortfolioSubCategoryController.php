<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClientReview;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioSubCategoryController extends Controller
{
    private const ALLOWED_ICONS = [
        'Palette', 'Clock', 'MessageSquare', 'FileText', 'Shield', 'CheckCircle',
        'Star', 'Zap', 'Globe', 'Repeat', 'Layers', 'Crown', 'FileCode',
        'Headset', 'DollarSign', 'PenLine', 'RotateCcw', 'Info', 'User',
    ];

    private const DEFAULT_DESCRIPTION_POINTS = [
        ['label' => 'Custom Designs', 'icon' => 'Palette'],
        ['label' => 'Fast Turnaround', 'icon' => 'Clock'],
        ['label' => 'Expert Consultation', 'icon' => 'MessageSquare'],
        ['label' => 'Source Files Included', 'icon' => 'FileText'],
        ['label' => 'Commercial License', 'icon' => 'Shield'],
        ['label' => 'Revisions Guaranteed', 'icon' => 'CheckCircle'],
    ];

    /** @return array<string, string> */
    private function categoryOptions(): array
    {
        /** @var array<string, array{label: string, description: string}> $cats */
        $cats = config('portfolio.categories', []);

        return array_map(fn (array $cat) => $cat['label'], $cats);
    }

    public function index(): Response
    {
        $subCategories = PortfolioSubCategory::orderBy('category_slug')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->withCount('portfolios')
            ->paginate(10)
            ->through(fn (PortfolioSubCategory $s) => [
                'id' => $s->id,
                'category_slug' => $s->category_slug,
                'category_label' => config("portfolio.categories.{$s->category_slug}.label", $s->category_slug),
                'name' => $s->name,
                'slug' => $s->slug,
                'description' => $s->description,
                'price' => $s->price,
                'rating' => $s->rating !== null ? (float) $s->rating : null,
                'reviews_count' => $s->reviews_count,
                'image' => $s->image,
                'sort_order' => $s->sort_order,
                'portfolios_count' => $s->portfolios_count,
            ]);

        return Inertia::render('Admin/PortfolioSubCategory/Index', [
            'subCategories' => $subCategories,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/PortfolioSubCategory/Create', [
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $categoryKeys = array_keys(config('portfolio.categories', []));

        $validated = $request->validate([
            'category_slug' => ['required', 'string', 'in:'.implode(',', $categoryKeys)],
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:120', 'unique:portfolio_sub_categories,slug'],
            'description' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'string', 'max:50'],
            'rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'reviews_count' => ['nullable', 'integer', 'min:0', 'max:999999'],
            'image' => ['nullable', 'image', 'max:2048'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);

        $validated['slug'] = $validated['slug']
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        unset($validated['image']);
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('sub-categories', 'public');
        }

        $subCategory = PortfolioSubCategory::create($validated);

        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        Cache::forget("portfolio.subcategories.{$validated['category_slug']}");
        Cache::forget('hire-us.subcategories');

        return redirect()->route('admin.sub-categories.edit', $subCategory)
            ->with('success', 'Sub-category created. Now fill in the plans, description points, and FAQs.');
    }

    public function edit(PortfolioSubCategory $subCategory): Response
    {
        $gallery = $subCategory->portfolios()
            ->latest()
            ->get()
            ->map(fn (Portfolio $p) => [
                'id' => $p->id,
                'media_path' => $p->media_path ? asset('storage/'.$p->media_path) : null,
                'media_type' => $p->media_type ?? 'image',
                'alt' => $p->alt,
            ])
            ->values();

        return Inertia::render('Admin/PortfolioSubCategory/Edit', [
            'subCategory' => [
                'id' => $subCategory->id,
                'category_slug' => $subCategory->category_slug,
                'name' => $subCategory->name,
                'slug' => $subCategory->slug,
                'description' => $subCategory->description,
                'price' => $subCategory->price,
                'rating' => $subCategory->rating !== null ? (float) $subCategory->rating : null,
                'reviews_count' => $subCategory->reviews_count,
                'image_url' => $subCategory->image ? asset('storage/'.$subCategory->image) : null,
                'sort_order' => $subCategory->sort_order,
                'plans' => (static function (array $stored): array {
                    $default = ['price' => '', 'delivery' => '', 'features' => []];

                    return [
                        'basic' => array_merge($default, $stored['basic'] ?? []),
                        'standard' => array_merge($default, $stored['standard'] ?? []),
                        'premium' => array_merge($default, $stored['premium'] ?? []),
                    ];
                })($subCategory->plans ?? []),
                'faqs' => $subCategory->faqs ?? [],
                'description_points' => $subCategory->description_points ?? self::DEFAULT_DESCRIPTION_POINTS,
                'gallery' => $gallery,
            ],
            'categories' => $this->categoryOptions(),
            'allowed_icons' => self::ALLOWED_ICONS,
        ]);
    }

    public function update(Request $request, PortfolioSubCategory $subCategory): RedirectResponse
    {
        $categoryKeys = array_keys(config('portfolio.categories', []));

        $validated = $request->validate([
            'category_slug' => ['required', 'string', 'in:'.implode(',', $categoryKeys)],
            'name' => ['required', 'string', 'max:100'],
            'slug' => [
                'nullable',
                'string',
                'max:120',
                Rule::unique('portfolio_sub_categories', 'slug')->ignore($subCategory->id),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'string', 'max:50'],
            'rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'reviews_count' => ['nullable', 'integer', 'min:0', 'max:999999'],
            'image' => ['nullable', 'image', 'max:2048'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'plans' => ['nullable', 'array'],
            'plans.basic' => ['nullable', 'array'],
            'plans.basic.price' => ['nullable', 'string', 'max:50'],
            'plans.basic.delivery' => ['nullable', 'string', 'max:50'],
            'plans.basic.features' => ['nullable', 'array', 'min:1'],
            'plans.basic.features.*' => ['string', 'max:200'],
            'plans.standard' => ['nullable', 'array'],
            'plans.standard.price' => ['nullable', 'string', 'max:50'],
            'plans.standard.delivery' => ['nullable', 'string', 'max:50'],
            'plans.standard.features' => ['nullable', 'array', 'min:1'],
            'plans.standard.features.*' => ['string', 'max:200'],
            'plans.premium' => ['nullable', 'array'],
            'plans.premium.price' => ['nullable', 'string', 'max:50'],
            'plans.premium.delivery' => ['nullable', 'string', 'max:50'],
            'plans.premium.features' => ['nullable', 'array', 'min:1'],
            'plans.premium.features.*' => ['string', 'max:200'],
            'faqs' => ['nullable', 'array'],
            'faqs.*.question' => ['required_with:faqs.*', 'string', 'max:500'],
            'faqs.*.answer' => ['required_with:faqs.*', 'string', 'max:2000'],
            'description_points' => ['required', 'array', 'size:6'],
            'description_points.*.label' => ['required', 'string', 'max:100'],
            'description_points.*.icon' => ['required', 'string', Rule::in(self::ALLOWED_ICONS)],
        ]);

        $validated['slug'] = $validated['slug']
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        unset($validated['image']);
        if ($request->hasFile('image')) {
            if ($subCategory->image) {
                Storage::disk('public')->delete($subCategory->image);
            }
            $validated['image'] = $request->file('image')->store('sub-categories', 'public');
        }

        $oldCategorySlug = $subCategory->category_slug;
        $subCategory->update($validated);

        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        Cache::forget("portfolio.subcategories.{$subCategory->category_slug}");
        Cache::forget('hire-us.subcategories');
        if ($oldCategorySlug !== $subCategory->category_slug) {
            Cache::forget("portfolio.subcategories.{$oldCategorySlug}");
        }

        return redirect()->route('admin.sub-categories.index')
            ->with('success', 'Sub-category updated.');
    }

    public function destroy(PortfolioSubCategory $subCategory): RedirectResponse
    {
        $categorySlug = $subCategory->category_slug;

        // Delete all gallery media files before removing Portfolio records.
        $subCategory->portfolios()->each(function (Portfolio $portfolio) {
            if ($portfolio->media_path) {
                Storage::disk('public')->delete($portfolio->media_path);
            }
            $portfolio->delete();
        });

        // Delete client review images (records cascade-delete with the subcategory).
        ClientReview::where('sub_category_id', $subCategory->id)
            ->whereNotNull('image_path')
            ->pluck('image_path')
            ->each(fn (string $path) => Storage::disk('public')->delete($path));

        // Delete the subcategory thumbnail.
        if ($subCategory->image) {
            Storage::disk('public')->delete($subCategory->image);
        }

        $subCategory->delete();

        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        Cache::forget("portfolio.subcategories.{$categorySlug}");
        Cache::forget('hire-us.subcategories');

        return back()->with('success', 'Sub-category deleted.');
    }

    public function galleryStore(Request $request, PortfolioSubCategory $subCategory): RedirectResponse
    {
        $request->validate([
            'media' => ['required', 'file', 'max:307200', 'mimes:jpg,jpeg,png,webp,gif,mp4,mov,avi,webm'],
            'caption' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $request->file('media');
        $path = $file->store('portfolios', 'public');
        $mediaType = $this->detectMediaType($file);
        $caption = $request->filled('caption') ? $request->input('caption') : $subCategory->name;

        Portfolio::create([
            'title' => $caption,
            'category' => $subCategory->category_slug,
            'sub_category_id' => $subCategory->id,
            'alt' => $caption,
            'media_path' => $path,
            'media_type' => $mediaType,
        ]);

        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        Cache::forget("portfolio.subcategories.{$subCategory->category_slug}");

        return back()->with('success', 'Media added to gallery.');
    }

    public function galleryDestroy(PortfolioSubCategory $subCategory, Portfolio $portfolio): RedirectResponse
    {
        abort_if($portfolio->sub_category_id !== $subCategory->id, 404);

        if ($portfolio->media_path) {
            Storage::disk('public')->delete($portfolio->media_path);
        }

        $portfolio->delete();

        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        Cache::forget("portfolio.subcategories.{$subCategory->category_slug}");

        return back()->with('success', 'Media removed from gallery.');
    }

    private function detectMediaType(UploadedFile $file): string
    {
        $videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
        $mime = $file->getMimeType() ?? '';
        $ext = strtolower($file->getClientOriginalExtension());

        if (str_starts_with($mime, 'video/') || in_array($ext, $videoExtensions)) {
            return 'video';
        }

        return 'image';
    }
}
