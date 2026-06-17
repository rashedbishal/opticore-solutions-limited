<?php

namespace App\Support;

use App\Mail\TaskStatusMail;
use App\Models\Category;
use App\Models\PortfolioSubCategory;
use App\Models\Task;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Automatically provisions a Client Workflow task when an order's payment
 * is confirmed successful.
 */
class TaskGenerator
{
    /**
     * Create the workflow task for a successfully paid order, unless one
     * already exists for this transaction or required data is missing.
     */
    public static function createFromTransaction(Transaction $transaction): ?Task
    {
        if (! $transaction->category) {
            return null;
        }

        if (Task::where('transaction_id', $transaction->transaction_id)->exists()) {
            return null;
        }

        $user = User::where('email', $transaction->email)->first();

        if (! $user) {
            return null;
        }

        $task = Task::create([
            'client_name' => $transaction->name,
            'user_id' => $user->id,
            'category' => $transaction->category,
            'sub_category_id' => $transaction->subcategory_id,
            'task_name' => self::taskName($transaction->category, $transaction->subcategory_id),
            'date' => now()->toDateString(),
            'state' => 'pending',
            'transaction_id' => $transaction->transaction_id,
        ]);

        if ($user->notify_order_updates) {
            Mail::to($user->email)->queue(new TaskStatusMail($task, $user->name));
        }

        return $task;
    }

    /**
     * Generate a task name from the order's category and sub-category,
     * e.g. "Logo, Branding and Rebranding - Graphic Design".
     */
    public static function taskName(string $category, ?int $subCategoryId): string
    {
        $categoryLabel = Category::configShape()[$category]['label'] ?? Str::headline($category);

        $subCategoryName = $subCategoryId
            ? PortfolioSubCategory::find($subCategoryId)?->name
            : null;

        return $subCategoryName
            ? "{$subCategoryName} - {$categoryLabel}"
            : "{$categoryLabel} Service";
    }
}
