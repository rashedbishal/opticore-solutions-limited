<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Portfolio;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioController extends Controller
{
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
            'portfolios' => Portfolio::latest()->paginate(10)->through(fn (Portfolio $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'category' => $p->category,
                'media_path' => $p->media_path ? asset('storage/'.$p->media_path) : null,
                'media_type' => $p->media_type ?? 'image',
            ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Portfolio/Create', [
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $categoryKeys = array_keys(config('portfolio.categories', []));

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => ['required', 'string', 'in:'.implode(',', $categoryKeys)],
            'alt' => 'nullable|string|max:255',
            'media' => [
                'required',
                'file',
                'max:102400',
                'mimes:jpg,jpeg,png,webp,gif,mp4,mov,avi,webm',
            ],
        ]);

        $mediaType = $this->detectMediaType($request->file('media'));
        $path = $request->file('media')->store('portfolios', 'public');

        Portfolio::create([
            'title' => $validated['title'],
            'category' => $validated['category'],
            'alt' => $validated['alt'] ?? null,
            'media_path' => $path,
            'media_type' => $mediaType,
        ]);

        return redirect()->route('admin.portfolios.index')->with('success', 'Portfolio created.');
    }

    public function edit(Portfolio $portfolio): Response
    {
        return Inertia::render('Admin/Portfolio/Edit', [
            'portfolio' => [
                'id' => $portfolio->id,
                'title' => $portfolio->title,
                'category' => $portfolio->category,
                'alt' => $portfolio->alt,
                'media_path' => $portfolio->media_path ? asset('storage/'.$portfolio->media_path) : null,
                'media_type' => $portfolio->media_type ?? 'image',
            ],
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(Request $request, Portfolio $portfolio): RedirectResponse
    {
        $categoryKeys = array_keys(config('portfolio.categories', []));

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => ['required', 'string', 'in:'.implode(',', $categoryKeys)],
            'alt' => 'nullable|string|max:255',
            'media' => [
                'nullable',
                'file',
                'max:102400',
                'mimes:jpg,jpeg,png,webp,gif,mp4,mov,avi,webm',
            ],
        ]);

        $updateData = [
            'title' => $validated['title'],
            'category' => $validated['category'],
            'alt' => $validated['alt'] ?? null,
        ];

        if ($request->hasFile('media')) {
            // Delete old file if exists
            if ($portfolio->media_path) {
                $cleanedPath = preg_replace('/^.*\/storage\//', '', $portfolio->media_path);
                Storage::disk('public')->delete($cleanedPath);
            }

            $mediaType = $this->detectMediaType($request->file('media'));
            $path = $request->file('media')->store('portfolios', 'public');

            $updateData['media_path'] = $path;
            $updateData['media_type'] = $mediaType;
        }

        $portfolio->update($updateData);

        return redirect()->route('admin.portfolios.index')->with('success', 'Portfolio updated.');
    }

    public function destroy(Portfolio $portfolio): RedirectResponse
    {
        if ($portfolio->media_path) {
            $cleanedPath = preg_replace('/^.*\/storage\//', '', $portfolio->media_path);
            Storage::disk('public')->delete($cleanedPath);
        }

        $portfolio->delete();

        return back()->with('success', 'Portfolio deleted.');
    }

    /**
     * Detect whether uploaded file is an image or video.
     * Uses both MIME type and extension fallback.
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
