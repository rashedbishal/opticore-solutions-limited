<?php

use App\Models\Admin;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

/**
 * Regression coverage for the task-attachment download route: it isn't under
 * the `admin.` prefix, so EnsureAdminHasPermission can't auto-derive a
 * permission key for it — the controller must check `canAccess('tasks')`
 * explicitly, mirroring ConversationController::downloadAttachment.
 */
beforeEach(function () {
    Storage::fake('local');

    $this->owner = User::factory()->create();
    $this->task = Task::factory()->for($this->owner)->create();

    $path = 'task-attachments/regression-test.pdf';
    Storage::disk('local')->put($path, 'attachment contents');

    $this->attachment = TaskAttachment::create([
        'task_id' => $this->task->id,
        'file_path' => $path,
        'original_name' => 'invoice.pdf',
        'mime_type' => 'application/pdf',
        'size' => 20,
    ]);
});

it('allows the owning client to download their own task attachment', function () {
    $this->actingAs($this->owner)
        ->get(route('task.attachment.download', $this->attachment))
        ->assertOk();
});

it('blocks a client from downloading another client\'s task attachment', function () {
    $intruder = User::factory()->create();

    $this->actingAs($intruder)
        ->get(route('task.attachment.download', $this->attachment))
        ->assertForbidden();
});

it('allows an admin with the tasks permission to download the attachment', function () {
    $admin = Admin::factory()->withPermissions(['tasks'])->create();

    $this->actingAs($admin, 'admin')
        ->get(route('task.attachment.download', $this->attachment))
        ->assertOk();
});

it('blocks an admin without the tasks permission from downloading the attachment', function () {
    $admin = Admin::factory()->withPermissions(['blogs'])->create();

    $this->actingAs($admin, 'admin')
        ->get(route('task.attachment.download', $this->attachment))
        ->assertForbidden();
});

it('blocks a guest from downloading a task attachment', function () {
    $this->get(route('task.attachment.download', $this->attachment))
        ->assertRedirect(route('login'));
});
