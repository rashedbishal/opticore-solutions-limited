<?php

namespace App\Http\Controllers\Admin;

use App\Events\MessageSent;
use App\Events\TaskUpdated;
use App\Http\Controllers\Controller;
use App\Mail\TaskStatusMail;
use App\Models\Admin;
use App\Models\Category;
use App\Models\PortfolioSubCategory;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
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
        return array_map(fn (array $cat) => $cat['label'], Category::configShape());
    }

    public function index(): Response
    {
        return Inertia::render('Admin/Task/Index', [
            'tasks' => Task::with(['user', 'subCategory'])
                ->latest()
                ->paginate(10)
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
            'users' => User::where('role', '!=', 'admin')->orderBy('name')->get(['id', 'name', 'email']),
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
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:4096'],
        ]);

        if (! isset($validated['state'])) {
            $validated['state'] = 'pending';
        }

        if ($validated['state'] === 'delivered') {
            $validated['review_eligible_until'] = now()->addHours(24);
        }

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('tasks', 'public');
        }

        unset($validated['image']);

        $task = Task::create($validated);

        $this->sendTaskStatusEmail($task->fresh()->load('user'));

        if ($validated['state'] === 'delivered') {
            $this->sendDeliveryMessage($task);
        }

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
                'image_url' => $task->image_path ? asset('storage/'.$task->image_path) : null,
            ],
            'categories' => $this->categoryOptions(),
            'subCategoriesByCategory' => $this->subCategoryOptionsByCategory(),
            'users' => User::where('role', '!=', 'admin')->orderBy('name')->get(['id', 'name', 'email']),
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
            'password' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:4096'],
            'remove_image' => ['nullable', 'boolean'],
        ]);

        $wasDelivered = $task->state === 'delivered';
        $becomingDelivered = isset($validated['state']) && $validated['state'] === 'delivered' && ! $wasDelivered;

        if ($becomingDelivered) {
            $admin = Auth::guard('admin')->user();

            if (! $admin || ! Hash::check($validated['password'] ?? '', $admin->password)) {
                return back()->withErrors(['password' => 'The password you entered is incorrect.']);
            }

            // Open the 24-hour review window when first marking a task as delivered.
            $validated['review_eligible_until'] = now()->addHours(24);
        }

        if ($request->hasFile('image')) {
            if ($task->image_path) {
                Storage::disk('public')->delete($task->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('tasks', 'public');
        } elseif (! empty($validated['remove_image'])) {
            if ($task->image_path) {
                Storage::disk('public')->delete($task->image_path);
            }
            $validated['image_path'] = null;
        }

        unset($validated['image'], $validated['remove_image'], $validated['password']);

        $previousState = $task->state;

        $task->update($validated);

        $freshTask = $task->fresh()->load(['user', 'subCategory']);

        TaskUpdated::dispatch($freshTask);

        $stateChanged = isset($validated['state']) && $validated['state'] !== $previousState;

        if ($stateChanged) {
            $this->sendTaskStatusEmail($freshTask);
        }

        if ($becomingDelivered) {
            $this->sendDeliveryMessage($freshTask);
        }

        return redirect()->route('admin.tasks.index')->with('success', 'Task updated successfully.');
    }

    public function destroy(Request $request, Task $task): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $motherAdmin = Admin::motherAdmin();

        if (! $motherAdmin || ! Hash::check($validated['password'], $motherAdmin->password)) {
            return back()->withErrors(['password' => 'The password you entered is incorrect.']);
        }

        if ($task->image_path) {
            Storage::disk('public')->delete($task->image_path);
        }

        $task->delete();

        return back()->with('success', 'Task deleted successfully.');
    }

    private function sendTaskStatusEmail(Task $task): void
    {
        $user = $task->user ?? User::find($task->user_id);

        // A trashed user's email is rewritten to an unreachable placeholder
        // on self-deletion (see ProfileController::deleteAccount) — never
        // queue mail to it even though the relation is kept for CMS display.
        if (! $user || $user->trashed() || ! $user->notify_order_updates) {
            return;
        }

        Mail::to($user->email)->queue(new TaskStatusMail($task, $user->name));
    }

    private function sendDeliveryMessage(Task $task): void
    {
        $user = User::find($task->user_id);
        if (! $user) {
            return;
        }

        $conversation = $user->conversation()->firstOrCreate([]);

        $serviceUrl = null;
        if ($task->subCategory) {
            $serviceUrl = route('hireUsSubCategory', [
                'category' => $task->category,
                'subcategory' => $task->subCategory->slug,
            ]);
        }

        $admin = Auth::guard('admin')->user();
        $senderId = $admin ? $admin->id : 0;

        $reviewLink = $serviceUrl ? "[[here:{$serviceUrl}]]" : 'here';

        $messageText = "🎉 Great news! Your task \"{$task->task_name}\" has been delivered!\n\nWe'd love to hear your feedback. You have 24 hours to leave a review for this service {$reviewLink}.\n\nThank you for choosing Opticore Solutions Ltd.!";

        $userOnline = Cache::has("user_chat_online_{$user->id}");

        $message = $conversation->messages()->create([
            'sender_type' => 'admin',
            'sender_id' => $senderId,
            'message' => $messageText,
            'attachment_path' => null,
            'attachment_type' => null,
            'delivered_at' => $userOnline ? now() : null,
        ]);

        $conversation->update([
            'last_message' => "Your task \"{$task->task_name}\" has been delivered!",
            'last_message_at' => now(),
        ]);

        $message->load('conversation.user');

        broadcast(new MessageSent($message))->toOthers();
    }
}
