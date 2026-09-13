<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePortfolioRequest;
use App\Http\Requests\UpdatePortfolioRequest;
use App\Models\Category;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use App\Support\ImageUploadOptimizer;
use Illuminate\Http\RedirectResponse;
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
        $result = Cache::remember('admin.task.sub-category-options', now()->addHour(), function () {
            $data = [];

            PortfolioSubCategory::orderBy('category_slug')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->each(function (PortfolioSubCategory $s) use (&$data) {
                    $data[$s->category_slug][] = [
                        'id' => $s->id,
                        'name' => $s->name,
                        'slug' => $s->slug,
                    ];
                });

            return $data;
        });

        return $result;
    }

    /** @return array<string, string> */
    private function categoryOptions(): array
    {
        return array_map(fn (array $cat) => $cat['label'], Category::configShape());
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
                    'youtube_video_id' => $p->youtube_video_id,
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

    public function store(StorePortfolioRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Derive category_slug for backward compatibility
        $categorySlug = null;
        if ($validated['sub_category_id']) {
            $sub = PortfolioSubCategory::find($validated['sub_category_id']);
            $categorySlug = $sub?->category_slug;
        }

        if ($validated['media_source'] === 'youtube') {
            $youtubeVideoId = $this->extractYoutubeVideoId($validated['youtube_url']);

            Portfolio::create([
                'title' => $validated['title'],
                'category' => $categorySlug,
                'sub_category_id' => $validated['sub_category_id'] ?? null,
                'alt' => $validated['alt'] ?? null,
                'media_path' => null,
                'media_type' => 'youtube',
                'youtube_video_id' => $youtubeVideoId,
            ]);
        } else {
            $mediaType = $this->detectMediaType($request->file('media'));
            $path = $mediaType === 'image'
                ? ImageUploadOptimizer::store($request->file('media'), 'portfolios', 1600)
                : $request->file('media')->store('portfolios', 'public');

            Portfolio::create([
                'title' => $validated['title'],
                'category' => $categorySlug,
                'sub_category_id' => $validated['sub_category_id'] ?? null,
                'alt' => $validated['alt'] ?? null,
                'media_path' => $path,
                'media_type' => $mediaType,
                'youtube_video_id' => null,
            ]);
        }

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
                'youtube_video_id' => $portfolio->youtube_video_id,
            ],
            'categories' => $this->categoryOptions(),
            'subCategoriesByCategory' => $this->subCategoryOptionsByCategory(),
        ]);
    }

    public function update(UpdatePortfolioRequest $request, Portfolio $portfolio): RedirectResponse
    {
        $validated = $request->validated();

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

        if ($validated['media_source'] === 'youtube') {
            // Switching to or staying on YouTube — delete any existing uploaded file
            if ($portfolio->media_path) {
                Storage::disk('public')->delete($portfolio->media_path);
            }

            $youtubeVideoId = $this->extractYoutubeVideoId($validated['youtube_url']);

            $updateData['media_path'] = null;
            $updateData['media_type'] = 'youtube';
            $updateData['youtube_video_id'] = $youtubeVideoId;
        } else {
            // File upload mode — clear YouTube data
            $updateData['youtube_video_id'] = null;

            if ($request->hasFile('media')) {
                // Delete old file (whether it was a file or not)
                if ($portfolio->media_path) {
                    Storage::disk('public')->delete($portfolio->media_path);
                }

                $mediaType = $this->detectMediaType($request->file('media'));
                $path = $mediaType === 'image'
                    ? ImageUploadOptimizer::store($request->file('media'), 'portfolios', 1600)
                    : $request->file('media')->store('portfolios', 'public');

                $updateData['media_path'] = $path;
                $updateData['media_type'] = $mediaType;
            } else {
                // Keeping current file but clearing YouTube data (if switching from YouTube to file with no new upload)
                if ($portfolio->media_type === 'youtube') {
                    // Was YouTube, switching to file but no file provided — keep as-is or clear
                    // We leave media_path null (it was null for youtube entries)
                    $updateData['media_type'] = $portfolio->media_type;
                }
            }
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

    /**
     * Extract an 11-character YouTube video ID from a URL.
     * Supports: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID, youtube.com/shorts/ID
     */
    private function extractYoutubeVideoId(string $url): string
    {
        $patterns = [
            '/youtu\.be\/([\w\-]{11})/',
            '/youtube\.com\/watch\?.*v=([\w\-]{11})/',
            '/youtube\.com\/embed\/([\w\-]{11})/',
            '/youtube\.com\/shorts\/([\w\-]{11})/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $matches)) {
                return $matches[1];
            }
        }

        // Fallback: return last path segment or query value (already validated by regex in form request)
        return substr($url, -11);
    }
}
