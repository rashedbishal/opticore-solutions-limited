<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioController extends Controller
{
    /**
     * Build a grouped array of sub-categories keyed by category slug.
     *
     * @return array<string, array<int, array{id: int, name: string, slug: string}>>
     */
    private function subCategoryOptionsByCategory(): array
    {
        $result = [];

        PortfolioSubCategory::orderBy('category_slug')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->each(function (PortfolioSubCategory $s) use (&$result) {
                $result[$s->category_slug][] = [
                    'id' => $s->id,
                    'name' => $s->name,
                    'slug' => $s->slug,
                ];
            });

        return $result;
    }

    /** @return array<string, string> */
    private function categoryOptions(): array
    {
        /** @var array<string, array{label: string, description: string}> $cats */
        $cats = config('portfolio.categories', []);

        return array_map(fn (array $cat) => $cat['label'], $cats);
    }

    public function index(): Response
    {
        return Inertia::render('Admin/Portfolio/Index', [
            'portfolios' => Portfolio::with('subCategory')
                ->latest()
                ->paginate(10)
                ->through(fn (Portfolio $p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'category' => $p->category,
                    'sub_category' => $p->subCategory
                        ? ['id' => $p->subCategory->id, 'name' => $p->subCategory->name]
                        : null,
                    'media_path' => $p->media_path ? asset('storage/'.$p->media_path) : null,
                    'media_type' => $p->media_type ?? 'image',
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Portfolio/Create', [
            'categories' => $this->categoryOptions(),
            'subCategoriesByCategory' => $this->subCategoryOptionsByCategory(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'sub_category_id' => ['nullable', 'integer', 'exists:portfolio_sub_categories,id'],
            'alt' => ['nullable', 'string', 'max:255'],
            'media' => [
                'required',
                'file',
                'max:102400',
                'mimes:jpg,jpeg,png,webp,gif,mp4,mov,avi,webm',
            ],
        ]);

        $mediaType = $this->detectMediaType($request->file('media'));
        $path = $request->file('media')->store('portfolios', 'public');

        // Derive category_slug for backward compatibility
        $categorySlug = null;
        if ($validated['sub_category_id']) {
            $sub = PortfolioSubCategory::find($validated['sub_category_id']);
            $categorySlug = $sub?->category_slug;
        }

        Portfolio::create([
            'title' => $validated['title'],
            'category' => $categorySlug,
            'sub_category_id' => $validated['sub_category_id'] ?? null,
            'alt' => $validated['alt'] ?? null,
            'media_path' => $path,
            'media_type' => $mediaType,
        ]);

        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        if ($categorySlug) {
            Cache::forget("portfolio.subcategories.{$categorySlug}");
        }

        return redirect()->route('admin.portfolios.index')->with('success', 'Portfolio created.');
    }

    public function edit(Portfolio $portfolio): Response
    {
        return Inertia::render('Admin/Portfolio/Edit', [
            'portfolio' => [
                'id' => $portfolio->id,
                'title' => $portfolio->title,
                'category' => $portfolio->category,
                'sub_category_id' => $portfolio->sub_category_id,
                'alt' => $portfolio->alt,
                'media_path' => $portfolio->media_path ? asset('storage/'.$portfolio->media_path) : null,
                'media_type' => $portfolio->media_type ?? 'image',
            ],
            'categories' => $this->categoryOptions(),
            'subCategoriesByCategory' => $this->subCategoryOptionsByCategory(),
        ]);
    }

    public function update(Request $request, Portfolio $portfolio): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'sub_category_id' => ['nullable', 'integer', 'exists:portfolio_sub_categories,id'],
            'alt' => ['nullable', 'string', 'max:255'],
            'media' => [
                'nullable',
                'file',
                'max:102400',
                'mimes:jpg,jpeg,png,webp,gif,mp4,mov,avi,webm',
            ],
        ]);

        // Derive category_slug for backward compatibility
        $categorySlug = null;
        if ($validated['sub_category_id']) {
            $sub = PortfolioSubCategory::find($validated['sub_category_id']);
            $categorySlug = $sub?->category_slug;
        }

        $updateData = [
            'title' => $validated['title'],
            'category' => $categorySlug,
            'sub_category_id' => $validated['sub_category_id'] ?? null,
            'alt' => $validated['alt'] ?? null,
        ];

        if ($request->hasFile('media')) {
            if ($portfolio->media_path) {
                Storage::disk('public')->delete($portfolio->media_path);
            }

            $mediaType = $this->detectMediaType($request->file('media'));
            $path = $request->file('media')->store('portfolios', 'public');

            $updateData['media_path'] = $path;
            $updateData['media_type'] = $mediaType;
        }

        $oldCategorySlug = $portfolio->category;
        $portfolio->update($updateData);

        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        if ($categorySlug) {
            Cache::forget("portfolio.subcategories.{$categorySlug}");
        }
        if ($oldCategorySlug && $oldCategorySlug !== $categorySlug) {
            Cache::forget("portfolio.subcategories.{$oldCategorySlug}");
        }

        return redirect()->route('admin.portfolios.index')->with('success', 'Portfolio updated.');
    }

    public function destroy(Portfolio $portfolio): RedirectResponse
    {
        $categorySlug = $portfolio->category;

        if ($portfolio->media_path) {
            Storage::disk('public')->delete($portfolio->media_path);
        }

        $portfolio->delete();

        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        if ($categorySlug) {
            Cache::forget("portfolio.subcategories.{$categorySlug}");
        }

        return back()->with('success', 'Portfolio deleted.');
    }

    /**
     * Detect whether uploaded file is an image or video.
     */
    private function detectMediaType(UploadedFile $file): string
    {
        $imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        $videoExtensions = ['mp4', 'mov', 'avi', 'webm'];

        $mime = $file->getMimeType() ?? '';
        $ext = strtolower($file->getClientOriginalExtension());

        if (str_starts_with($mime, 'video/') || in_array($ext, $videoExtensions)) {
            return 'video';
        }

        if (str_starts_with($mime, 'image/') || in_array($ext, $imageExtensions)) {
            return 'image';
        }

        return 'image';
    }
}
