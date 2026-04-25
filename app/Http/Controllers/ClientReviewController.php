<?php

namespace App\Http\Controllers;

use App\Models\ClientReview;
use App\Models\PortfolioSubCategory;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientReviewController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'task_id' => ['required', 'integer', 'exists:tasks,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'max:4096'],
            'price_range' => ['nullable', 'string', 'max:100'],
            'work_duration' => ['nullable', 'string', 'max:100'],
        ]);

        $user = Auth::user();
        $task = Task::findOrFail($validated['task_id']);

        // Verify the task belongs to this user.
        abort_if($task->user_id !== $user->id, 403);

        // Verify the task is delivered and within the review window.
        abort_if($task->state !== 'delivered', 403, 'Task has not been delivered yet.');
        abort_if(
            $task->review_eligible_until === null || $task->review_eligible_until->isPast(),
            403,
            'The review window for this task has expired.'
        );

        // Prevent duplicate reviews.
        abort_if($task->review()->exists(), 409, 'You have already submitted a review for this task.');

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('reviews', 'public');
        }

        // Determine client type: repeat if the user has other delivered tasks besides this one.
        $isRepeat = Task::where('user_id', $user->id)
            ->where('id', '!=', $task->id)
            ->where('state', 'delivered')
            ->exists();

        ClientReview::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'sub_category_id' => $task->sub_category_id,
            'category_slug' => $task->category,
            'username' => $user->name,
            'client_type' => $isRepeat ? 'repeat' : 'new',
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
            'image_path' => $imagePath,
            'price_range' => $validated['price_range'] ?? null,
            'work_duration' => $validated['work_duration'] ?? null,
            'sort_order' => 0,
        ]);

        // Recalculate and persist the subcategory's aggregate rating and review count.
        $this->recalculateSubCategoryStats((int) $task->sub_category_id);

        return back()->with('success', 'Your review has been submitted. Thank you!');
    }

    private function recalculateSubCategoryStats(int $subCategoryId): void
    {
        $reviews = ClientReview::where('sub_category_id', $subCategoryId);
        $count = $reviews->count();
        $avg = $count > 0 ? round($reviews->avg('rating'), 1) : 0.0;

        PortfolioSubCategory::where('id', $subCategoryId)->update([
            'reviews_count' => $count,
            'rating' => $avg,
        ]);
    }
}
