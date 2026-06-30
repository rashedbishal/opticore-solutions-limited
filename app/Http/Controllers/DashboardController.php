<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        return Inertia::render('Dashboard/Index', [
            'tasks' => Inertia::defer(fn () => Task::with(['subCategory', 'review'])
                ->select(['id', 'task_name', 'category', 'sub_category_id', 'state', 'date', 'review_eligible_until'])
                ->where('user_id', $user->id)
                ->latest()
                ->get()
                ->map(function (Task $task) {
                    $canReview = $task->state === 'delivered'
                        && $task->review_eligible_until !== null
                        && ! $task->review_eligible_until->isPast()
                        && $task->review === null;

                    $serviceUrl = null;
                    if ($task->subCategory) {
                        $serviceUrl = route('hireUsSubCategory', [
                            'category' => $task->category,
                            'subcategory' => $task->subCategory->slug,
                        ]);
                    }

                    return [
                        'id' => $task->id,
                        'task_name' => $task->task_name,
                        'category' => $task->category,
                        'sub_category' => $task->subCategory
                            ? ['id' => $task->subCategory->id, 'name' => $task->subCategory->name, 'slug' => $task->subCategory->slug]
                            : null,
                        'date' => $task->date ? $task->date->format('Y-m-d') : null,
                        'state' => $task->state,
                        'can_review' => $canReview,
                        'has_review' => $task->review !== null,
                        'review_eligible_until' => $task->review_eligible_until?->toISOString(),
                        'service_url' => $serviceUrl,
                    ];
                })),
        ]);
    }
}
