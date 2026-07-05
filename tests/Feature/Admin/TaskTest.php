<?php

use App\Models\Admin;
use App\Models\PortfolioSubCategory;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create(['password' => Hash::make('mother-secret')]);
    $this->user = User::factory()->create();
});

it('displays the task creation page with required props', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.tasks.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Task/Create')
            ->has('categories')
            ->has('subCategoriesByCategory')
        );
});

it('can store a new task', function () {
    $subCategory = PortfolioSubCategory::factory()->create();

    $taskData = [
        'client_name' => 'John Doe',
        'user_id' => $this->user->id,
        'category' => $subCategory->category_slug,
        'sub_category_id' => $subCategory->id,
        'task_name' => 'Design Logo',
        'date' => now()->format('Y-m-d'),
        'state' => 'pending',
    ];

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.tasks.store'), $taskData)
        ->assertRedirect(route('admin.tasks.index'));

    $this->assertDatabaseHas('tasks', [
        'client_name' => 'John Doe',
        'task_name' => 'Design Logo',
    ]);
});

it('still shows the client email in the task list after the client deletes their own account', function () {
    $client = User::factory()->create(['email' => 'soon-gone@example.com']);
    $task = Task::factory()->create(['user_id' => $client->id]);
    $client->delete();

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.tasks.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Task/Index')
            ->where('tasks.data.0.id', $task->id)
            ->where('tasks.data.0.client_email', 'soon-gone@example.com')
        );
});

it('displays the task edit page with required props', function () {
    $task = Task::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.tasks.edit', $task))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Task/Edit')
            ->has('task')
            ->has('categories')
            ->has('subCategoriesByCategory')
        );
});

it('can update a task', function () {
    $task = Task::factory()->create(['user_id' => $this->user->id]);

    $updateData = [
        'client_name' => 'Jane Doe',
        'task_name' => 'Updated Task Name',
        'state' => 'in progress',
    ];

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.tasks.update', $task), $updateData)
        ->assertRedirect(route('admin.tasks.index')); // TaskController now redirects to index

    $this->assertDatabaseHas('tasks', [
        'id' => $task->id,
        'client_name' => 'Jane Doe',
        'task_name' => 'Updated Task Name',
        'state' => 'in progress',
    ]);
});

it('validates task creation', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.tasks.store'), [])
        ->assertSessionHasErrors(['client_name', 'user_id', 'category', 'task_name', 'date']);
});

it('rejects deleting a task without the mother admin password', function () {
    $task = Task::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.tasks.destroy', $task))
        ->assertSessionHasErrors(['password']);

    $this->assertDatabaseHas('tasks', ['id' => $task->id]);
});

it('rejects deleting a task with an incorrect mother admin password', function () {
    $task = Task::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.tasks.destroy', $task), ['password' => 'wrong-password'])
        ->assertSessionHasErrors(['password']);

    $this->assertDatabaseHas('tasks', ['id' => $task->id]);
});

it('deletes a task using the mother admin password', function () {
    $task = Task::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.tasks.destroy', $task), ['password' => 'mother-secret'])
        ->assertRedirect();

    $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
});
