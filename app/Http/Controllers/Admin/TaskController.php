<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortfolioSubCategory;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
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
        return Inertia::render('Admin/Task/Index', [
            'tasks' => Task::with(['user', 'subCategory'])
                ->latest()
                ->paginate(15)
                ->through(fn (Task $t) => [
                    'id' => $t->id,
                    'client_name' => $t->client_name,
                    'client_email' => $t->user ? $t->user->email : null,
                    'category' => $t->category,
                    'sub_category' => $t->subCategory ? ['id' => $t->subCategory->id, 'name' => $t->subCategory->name] : null,
                    'task_name' => $t->task_name,
                    'date' => $t->date ? $t->date->format('Y-m-d') : null,
                    'state' => $t->state,
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Task/Create', [
            'categories' => $this->categoryOptions(),
            'subCategoriesByCategory' => $this->subCategoryOptionsByCategory(),
            'users' => User::orderBy('name')->get(['id', 'name', 'email']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_name' => ['required', 'string', 'max:255'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'category' => ['required', 'string'],
            'sub_category_id' => ['nullable', 'integer', 'exists:portfolio_sub_categories,id'],
            'task_name' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'state' => ['nullable', 'string', 'in:pending,in progress,delivered'],
        ]);

        if (! isset($validated['state'])) {
            $validated['state'] = 'pending';
        }

        Task::create($validated);

        return redirect()->route('admin.tasks.index')->with('success', 'Task created successfully.');
    }

    public function edit(Task $task): Response
    {
        return Inertia::render('Admin/Task/Edit', [
            'task' => [
                'id' => $task->id,
                'client_name' => $task->client_name,
                'user_id' => $task->user_id,
                'category' => $task->category,
                'sub_category_id' => $task->sub_category_id,
                'task_name' => $task->task_name,
                'date' => $task->date ? $task->date->format('Y-m-d') : null,
                'state' => $task->state,
            ],
            'categories' => $this->categoryOptions(),
            'subCategoriesByCategory' => $this->subCategoryOptionsByCategory(),
            'users' => User::orderBy('name')->get(['id', 'name', 'email']),
        ]);
    }

    public function update(Request $request, Task $task): RedirectResponse
    {
        $validated = $request->validate([
            'client_name' => ['sometimes', 'required', 'string', 'max:255'],
            'user_id' => ['sometimes', 'required', 'integer', 'exists:users,id'],
            'category' => ['sometimes', 'required', 'string'],
            'sub_category_id' => ['nullable', 'integer', 'exists:portfolio_sub_categories,id'],
            'task_name' => ['sometimes', 'required', 'string', 'max:255'],
            'date' => ['sometimes', 'required', 'date'],
            'state' => ['sometimes', 'required', 'string', 'in:pending,in progress,delivered'],
        ]);

        // Open the 24-hour review window when first marking a task as delivered.
        if (
            isset($validated['state']) &&
            $validated['state'] === 'delivered' &&
            $task->state !== 'delivered'
        ) {
            $validated['review_eligible_until'] = now()->addHours(24);
        }

        $task->update($validated);

        return redirect()->route('admin.tasks.index')->with('success', 'Task updated successfully.');
    }

    public function destroy(Task $task): RedirectResponse
    {
        $task->delete();

        return back()->with('success', 'Task deleted successfully.');
    }
}
