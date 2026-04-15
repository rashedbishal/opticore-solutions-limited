<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortfolioSubCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioSubCategoryController extends Controller
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
        $subCategories = PortfolioSubCategory::orderBy('category_slug')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->withCount('portfolios')
            ->get()
            ->map(fn (PortfolioSubCategory $s) => [
                'id' => $s->id,
                'category_slug' => $s->category_slug,
                'category_label' => config("portfolio.categories.{$s->category_slug}.label", $s->category_slug),
                'name' => $s->name,
                'slug' => $s->slug,
                'description' => $s->description,
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
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);

        $validated['slug'] = $validated['slug']
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        PortfolioSubCategory::create($validated);

        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        Cache::forget("portfolio.subcategories.{$validated['category_slug']}");

        return redirect()->route('admin.portfolio-sub-categories.index')
            ->with('success', 'Sub-category created.');
    }

    public function edit(PortfolioSubCategory $portfolioSubCategory): Response
    {
        return Inertia::render('Admin/PortfolioSubCategory/Edit', [
            'subCategory' => [
                'id' => $portfolioSubCategory->id,
                'category_slug' => $portfolioSubCategory->category_slug,
                'name' => $portfolioSubCategory->name,
                'slug' => $portfolioSubCategory->slug,
                'description' => $portfolioSubCategory->description,
                'sort_order' => $portfolioSubCategory->sort_order,
            ],
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(Request $request, PortfolioSubCategory $portfolioSubCategory): RedirectResponse
    {
        $categoryKeys = array_keys(config('portfolio.categories', []));

        $validated = $request->validate([
            'category_slug' => ['required', 'string', 'in:'.implode(',', $categoryKeys)],
            'name' => ['required', 'string', 'max:100'],
            'slug' => [
                'nullable',
                'string',
                'max:120',
                Rule::unique('portfolio_sub_categories', 'slug')->ignore($portfolioSubCategory->id),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);

        $validated['slug'] = $validated['slug']
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        $oldCategorySlug = $portfolioSubCategory->category_slug;
        $portfolioSubCategory->update($validated);

        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        Cache::forget("portfolio.subcategories.{$portfolioSubCategory->category_slug}");
        if ($oldCategorySlug !== $portfolioSubCategory->category_slug) {
            Cache::forget("portfolio.subcategories.{$oldCategorySlug}");
        }

        return redirect()->route('admin.portfolio-sub-categories.index')
            ->with('success', 'Sub-category updated.');
    }

    public function destroy(PortfolioSubCategory $portfolioSubCategory): RedirectResponse
    {
        if ($portfolioSubCategory->portfolios()->exists()) {
            return back()->with('error', 'Cannot delete a sub-category that has portfolios assigned to it.');
        }

        $categorySlug = $portfolioSubCategory->category_slug;

        $portfolioSubCategory->delete();

        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        Cache::forget("portfolio.subcategories.{$categorySlug}");

        return back()->with('success', 'Sub-category deleted.');
    }
}
