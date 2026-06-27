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
use App\Models\TaskAttachment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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

    public function index(Request $request): Response
    {
        $tasks = Task::with(['user', 'subCategory', 'transaction'])
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->input('search');
                $query->where(function ($query) use ($search) {
                    $query->where('client_name', 'like', "%{$search}%")
                        ->orWhere('task_name', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($q) => $q->where('email', 'like', "%{$search}%"))
                        ->orWhereHas('transaction', fn ($q) => $q->where('order_number', 'like', "%{$search}%"));
                });
            })
            ->when($request->filled('state'), fn ($q) => $q->where('state', $request->input('state')))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Task $t) => [
                'id' => $t->id,
                'order_number' => $t->transaction?->order_number,
                'client_name' => $t->client_name,
                'client_email' => $t->user ? $t->user->email : null,
                'category' => $t->category,
                'sub_category' => $t->subCategory ? ['id' => $t->subCategory->id, 'name' => $t->subCategory->name] : null,
                'task_name' => $t->task_name,
                'date' => $t->date ? $t->date->format('Y-m-d') : null,
                'state' => $t->state,
            ]);

        return Inertia::render('Admin/Task/Index', [
            'tasks' => $tasks,
            'filters' => $request->only(['search', 'state']),
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
            'notes' => ['nullable', 'string', 'max:5000'],
            'attachments' => ['nullable', 'array', 'max:10'],
            'attachments.*' => ['file', 'mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi,mkv,webm,mpeg,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv'],
        ]);

        if ($request->hasFile('attachments')) {
            $totalBytes = collect($request->file('attachments'))->sum(fn ($f) => $f->getSize());
            if ($totalBytes > 300 * 1024 * 1024) {
                return back()->withErrors(['attachments' => 'Total attachment size must not exceed 300 MB.']);
            }
        }

        if (! isset($validated['state'])) {
            $validated['state'] = 'pending';
        }

        if ($validated['state'] === 'delivered') {
            $validated['review_eligible_until'] = now()->addHours(24);
        }

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('tasks', 'public');
        }

        unset($validated['image'], $validated['attachments']);

        $task = Task::create($validated);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->storeAs(
                    'task_uploads/tasks/'.$task->id,
                    Str::uuid().'.'.$file->getClientOriginalExtension(),
                    'local',
                );
                TaskAttachment::create([
                    'task_id' => $task->id,
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ]);
            }
        }

        $this->sendTaskStatusEmail($task->fresh()->load('user'));

        if ($validated['state'] === 'delivered') {
            $this->sendDeliveryMessage($task);
        }

        return redirect()->route('admin.tasks.index')->with('success', 'Task created successfully.');
    }

    public function show(Task $task): Response
    {
        $task->loadMissing(['user', 'subCategory', 'attachments', 'transaction']);

        return Inertia::render('Admin/Task/Show', [
            'task' => [
                'id' => $task->id,
                'client_name' => $task->client_name,
                'client_email' => $task->user?->email,
                'category' => $task->category,
                'sub_category' => $task->subCategory ? ['id' => $task->subCategory->id, 'name' => $task->subCategory->name] : null,
                'task_name' => $task->task_name,
                'date' => $task->date ? $task->date->format('Y-m-d') : null,
                'state' => $task->state,
                'order_number' => $task->transaction?->order_number,
                'image_url' => $task->image_path ? asset('storage/'.$task->image_path) : null,
                'notes' => $task->notes,
                'transaction_id' => $task->transaction_id,
                'attachments' => $task->attachments->map(fn (TaskAttachment $a) => [
                    'id' => $a->id,
                    'original_name' => $a->original_name,
                    'mime_type' => $a->mime_type,
                    'size' => $a->size,
                    'download_url' => route('task.attachment.download', $a->id),
                ])->values()->all(),
                'created_at' => $task->created_at?->format('Y-m-d H:i'),
            ],
        ]);
    }

    public function edit(Task $task): Response
    {
        $task->loadMissing('attachments');

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
                'notes' => $task->notes,
                'attachments' => $task->attachments->map(fn (TaskAttachment $a) => [
                    'id' => $a->id,
                    'original_name' => $a->original_name,
                    'mime_type' => $a->mime_type,
                    'size' => $a->size,
                    'download_url' => route('task.attachment.download', $a->id),
                ])->values()->all(),
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

        foreach ($task->attachments as $attachment) {
            Storage::disk('local')->delete($attachment->file_path);
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
