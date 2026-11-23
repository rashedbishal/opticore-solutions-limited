<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Actions\SaveLeadCustomFieldValues;
use App\Leads\Enums\DealStatus;
use App\Leads\Enums\LeadPriority;
use App\Leads\Enums\TaskStatus;
use App\Leads\Events\LeadUpdated;
use App\Leads\Models\Deal;
use App\Leads\Models\DealStatusLog;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadCustomFieldDefinition;
use App\Leads\Models\LeadDetailUpdateLog;
use App\Leads\Models\LeadTag;
use App\Leads\Models\LeadTask;
use App\Leads\Models\LeadTaskStatusLog;
use App\Leads\Notifications\TaskAssignedNotification;
use App\Leads\Services\LeadAccess;
use App\Leads\Services\LeadPeople;
use App\Models\Admin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Tags, deals, tasks and custom-field values on one lead (same rules as
 * OptiFin): anyone who can work the lead can use them; only managers
 * delete deals; a task can be deleted by a manager, or by an agent if it's
 * their own.
 */
class LeadPipelineController extends Controller
{
    public function __construct(
        private readonly LeadAccess $access,
        private readonly LeadPeople $people,
    ) {}

    public function attachTag(Request $request, Lead $lead): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        $tag = LeadTag::query()->findOrFail((string) $request->input('tag_id'));

        $lead->tags()->syncWithoutDetaching([$tag->id => ['tagged_by' => $admin->id]]);
        LeadUpdated::dispatch($lead->id);

        return back()->with('success', "Tag \"{$tag->name}\" added.");
    }

    public function detachTag(Lead $lead, LeadTag $tag): RedirectResponse
    {
        $this->authorizeUpdate($lead);
        $lead->tags()->detach($tag->id);
        LeadUpdated::dispatch($lead->id);

        return back()->with('success', "Tag \"{$tag->name}\" removed.");
    }

    public function saveDeal(Request $request, Lead $lead, ?Deal $deal = null): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        abort_if($deal !== null && $deal->lead_id !== $lead->id, 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'value' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99', 'regex:/^\d{1,12}(\.\d{1,2})?$/'],
            'currency_id' => ['nullable', 'string', Rule::exists('currencies', 'id')],
            'probability' => ['nullable', 'integer', 'min:0', 'max:100'],
            'expected_close_date' => ['nullable', 'date'],
            'owner_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ], ['value.regex' => 'Enter a plain amount with up to 2 decimal places.']);

        $owner = $this->personOrFail($validated['owner_id'] ?? null, 'owner_id', $deal?->owner_id);

        $attributes = [
            'name' => $validated['name'],
            'value' => ($validated['value'] ?? null) ?: null,
            'currency_id' => ! empty($validated['value']) ? (($validated['currency_id'] ?? null) ?: null) : null,
            'probability' => ($validated['probability'] ?? null) ?: null,
            'expected_close_date' => ($validated['expected_close_date'] ?? null) ?: null,
            'owner_id' => empty($validated['owner_id']) ? null : (int) $validated['owner_id'],
            'owner_name' => empty($validated['owner_id']) ? null : $this->ownerName($owner, $deal),
            'notes' => ($validated['notes'] ?? null) ?: null,
        ];

        $deal !== null
            ? $deal->update($attributes)
            : Deal::create([...$attributes, 'lead_id' => $lead->id, 'status' => DealStatus::Open, 'created_by' => $admin->id]);

        LeadUpdated::dispatch($lead->id);

        return back()->with('success', 'Deal saved.');
    }

    public function dealStatus(Request $request, Lead $lead, Deal $deal): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        abort_if($deal->lead_id !== $lead->id, 404);

        $target = DealStatus::tryFrom((string) $request->input('status'));

        if ($target === null || ! $deal->status->canTransitionTo($target)) {
            return back()->with('error', 'That status change is not allowed.');
        }

        DB::transaction(function () use ($deal, $target, $admin): void {
            $old = $deal->status;
            $deal->update(['status' => $target, 'actual_close_date' => $target === DealStatus::Open ? null : now()->toDateString()]);
            DealStatusLog::create(['deal_id' => $deal->id, 'changed_by' => $admin->id, 'changed_by_name' => $admin->name, 'old_status' => $old, 'new_status' => $target]);
        });

        LeadUpdated::dispatch($lead->id);

        return back()->with('success', 'Deal status updated.');
    }

    public function destroyDeal(Lead $lead, Deal $deal): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        abort_unless($deal->lead_id === $lead->id, 404);
        abort_unless($this->access->canDelete($admin), 403);

        $deal->delete();
        LeadUpdated::dispatch($lead->id);

        return back()->with('success', 'Deal deleted.');
    }

    public function saveTask(Request $request, Lead $lead, ?LeadTask $task = null): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        abort_if($task !== null && $task->lead_id !== $lead->id, 404);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'deal_id' => ['nullable', 'string', Rule::exists('deals', 'id')->where('lead_id', $lead->id)],
            'due_date' => ['nullable', 'date'],
            'due_time' => ['nullable', 'date_format:H:i'],
            'priority' => ['required', Rule::enum(LeadPriority::class)],
            'assigned_to' => ['nullable', 'integer'],
        ]);

        $assignee = $this->personOrFail($validated['assigned_to'] ?? null, 'assigned_to', $task?->assigned_to);
        $previous = $task?->assigned_to;

        $attributes = [
            'title' => $validated['title'],
            'description' => ($validated['description'] ?? null) ?: null,
            'deal_id' => ($validated['deal_id'] ?? null) ?: null,
            'due_date' => ($validated['due_date'] ?? null) ?: null,
            'due_time' => ($validated['due_time'] ?? null) ?: null,
            'priority' => LeadPriority::from($validated['priority']),
            'assigned_to' => empty($validated['assigned_to']) ? null : (int) $validated['assigned_to'],
        ];

        if ($task !== null) {
            $task->update($attributes);
        } else {
            $task = LeadTask::create([...$attributes, 'lead_id' => $lead->id, 'status' => TaskStatus::Pending, 'created_by' => $admin->id]);
        }

        // Assigning a task to yourself needs no alert.
        if ($assignee !== null && $task->assigned_to !== $previous && (int) $assignee->id !== (int) $admin->id) {
            $assignee->notify(new TaskAssignedNotification($task, $admin->name));
        }

        LeadUpdated::dispatch($lead->id);

        return back()->with('success', 'Task saved.');
    }

    public function taskStatus(Request $request, Lead $lead, LeadTask $task): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        abort_if($task->lead_id !== $lead->id, 404);

        $target = TaskStatus::tryFrom((string) $request->input('status'));

        if ($target === null || ! $task->status->canTransitionTo($target)) {
            return back()->with('error', 'That status change is not allowed.');
        }

        DB::transaction(function () use ($task, $target, $admin): void {
            $old = $task->status;
            $task->update(['status' => $target, 'closed_at' => $target === TaskStatus::Pending ? null : now()]);
            LeadTaskStatusLog::create(['lead_task_id' => $task->id, 'changed_by' => $admin->id, 'changed_by_name' => $admin->name, 'old_status' => $old, 'new_status' => $target]);
        });

        LeadUpdated::dispatch($lead->id);

        return back()->with('success', 'Task status updated.');
    }

    public function destroyTask(Lead $lead, LeadTask $task): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        abort_unless($task->lead_id === $lead->id, 404);
        abort_unless($this->access->canDelete($admin) || ($task->assigned_to !== null && $task->assigned_to === (int) $admin->id), 403);

        $task->delete();
        LeadUpdated::dispatch($lead->id);

        return back()->with('success', 'Task deleted.');
    }

    public function saveCustomFields(Request $request, Lead $lead, SaveLeadCustomFieldValues $save): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        $definitions = LeadCustomFieldDefinition::query()->activeOrdered()->get();

        $rules = [];
        $names = [];

        foreach ($definitions as $definition) {
            $rules["fields.{$definition->id}"] = $definition->rules();
            $names["fields.{$definition->id}"] = $definition->name;
        }

        $validated = $request->validate($rules, [], $names);
        $changed = $save->handle($lead, $validated['fields'] ?? []);

        if ($changed !== []) {
            LeadDetailUpdateLog::create(['lead_id' => $lead->id, 'changed_by' => $admin->id, 'changed_by_name' => $admin->name, 'changed_fields' => $changed]);
            $lead->touch();
            LeadUpdated::dispatch($lead->id);
        }

        return $changed === [] ? back() : back()->with('success', 'Lead updated.');
    }

    /** The chosen owner's name, or the existing snapshot when they kept a former owner. */
    private function ownerName(?Admin $owner, ?Deal $deal): ?string
    {
        if ($owner !== null) {
            return $owner->name;
        }

        return $deal === null ? null : $deal->owner_name;
    }

    /**
     * Someone with a lead role, or (when editing) the person already set
     * even if they no longer have a role.
     */
    private function personOrFail(mixed $id, string $field, ?int $current): ?Admin
    {
        if (empty($id)) {
            return null;
        }

        $person = $this->people->findLeadUser((int) $id);

        if ($person === null && (int) $id !== $current) {
            throw ValidationException::withMessages([$field => 'Please choose someone with lead access.']);
        }

        return $person;
    }

    private function authorizeUpdate(Lead $lead): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($this->access->canUpdate($admin, $lead), 403);

        return $admin;
    }
}
