<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
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
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Category/Create');
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        Category::create($request->validated());
        $this->flushCategoryCaches();

        return redirect()->route('admin.categories.index')->with('success', 'Category created.');
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('Admin/Category/Edit', [
            'category' => [
                'id' => $category->id,
                'slug' => $category->slug,
                'label' => $category->label,
                'description' => $category->description,
                'sort_order' => $category->sort_order,
            ],
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $category->update($request->validated());
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

        $category->delete();
        $this->flushCategoryCaches();

        return back()->with('success', 'Category deleted.');
    }

    private function flushCategoryCaches(): void
    {
        Cache::forget('categories.config-shape');
        Cache::forget('portfolio.categories.index');
        Cache::forget('home.featuredPortfolios');
        Cache::forget('hire-us.subcategories');
    }
}
