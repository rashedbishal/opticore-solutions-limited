<?php

use App\Events\MessageSent;
use App\Models\Admin;
use App\Models\Conversation;
use App\Models\PortfolioSubCategory;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
    $this->user = User::factory()->create();
});

it('opens a 24 hour review window when a task is created already delivered', function () {
    $subCategory = PortfolioSubCategory::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.tasks.store'), [
            'client_name' => 'Client A',
            'user_id' => $this->user->id,
            'category' => $subCategory->category_slug,
            'sub_category_id' => $subCategory->id,
            'task_name' => 'Brand Identity Pack',
            'date' => now()->format('Y-m-d'),
            'state' => 'delivered',
        ])
        ->assertRedirect(route('admin.tasks.index'));

    $task = Task::query()->where('task_name', 'Brand Identity Pack')->firstOrFail();

    expect($task->state)->toBe('delivered');
    expect($task->review_eligible_until)->not->toBeNull();
    expect($task->review_eligible_until->isFuture())->toBeTrue();
});

it('does not open a review window when a task is created as pending', function () {
    $task = Task::factory()->create(['user_id' => $this->user->id, 'state' => 'pending']);

    expect($task->review_eligible_until)->toBeNull();
});

it('opens the review window only on the transition into delivered', function () {
    $task = Task::factory()->create([
        'user_id' => $this->user->id,
        'state' => 'pending',
        'review_eligible_until' => null,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.tasks.update', $task), [
            'state' => 'in progress',
        ])
        ->assertRedirect(route('admin.tasks.index'));

    expect($task->fresh()->review_eligible_until)->toBeNull();

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.tasks.update', $task), [
            'state' => 'delivered',
            'password' => 'password',
        ])
        ->assertRedirect(route('admin.tasks.index'));

    $task->refresh();
    expect($task->state)->toBe('delivered');
    expect($task->review_eligible_until)->not->toBeNull();
    expect($task->review_eligible_until->isFuture())->toBeTrue();
});

it('does not reset the review window when a task remains delivered', function () {
    $eligibleUntil = now()->addHours(10);

    $task = Task::factory()->create([
        'user_id' => $this->user->id,
        'state' => 'delivered',
        'review_eligible_until' => $eligibleUntil,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.tasks.update', $task), [
            'state' => 'delivered',
            'task_name' => 'Renamed While Delivered',
        ])
        ->assertRedirect(route('admin.tasks.index'));

    $task->refresh();
    expect($task->task_name)->toBe('Renamed While Delivered');
    expect($task->review_eligible_until->format('Y-m-d H:i:s'))->toBe($eligibleUntil->format('Y-m-d H:i:s'));
});

it('dispatches a delivery message and broadcasts it when a task transitions to delivered', function () {
    Event::fake([MessageSent::class]);

    $subCategory = PortfolioSubCategory::factory()->create();
    $task = Task::factory()->create([
        'user_id' => $this->user->id,
        'state' => 'pending',
        'sub_category_id' => $subCategory->id,
        'category' => $subCategory->category_slug,
        'task_name' => 'Promo Video Edit',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.tasks.update', $task), [
            'state' => 'delivered',
            'password' => 'password',
        ])
        ->assertRedirect(route('admin.tasks.index'));

    $conversation = Conversation::query()->where('user_id', $this->user->id)->firstOrFail();
    $message = $conversation->messages()->where('sender_type', 'admin')->latest()->first();

    expect($message)->not->toBeNull();
    expect($message->message)->toContain('Promo Video Edit');
    expect($message->message)->toContain('24 hours');

    Event::assertDispatched(MessageSent::class, function (MessageSent $event) use ($message) {
        return $event->message->id === $message->id;
    });
});

it('rejects marking a task delivered without the current admin password', function () {
    $task = Task::factory()->create([
        'user_id' => $this->user->id,
        'state' => 'pending',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.tasks.update', $task), [
            'state' => 'delivered',
        ])
        ->assertSessionHasErrors(['password']);

    expect($task->fresh()->state)->toBe('pending');
});

it('rejects marking a task delivered with an incorrect admin password', function () {
    $task = Task::factory()->create([
        'user_id' => $this->user->id,
        'state' => 'pending',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.tasks.update', $task), [
            'state' => 'delivered',
            'password' => 'wrong-password',
        ])
        ->assertSessionHasErrors(['password']);

    expect($task->fresh()->state)->toBe('pending');
});

it('does not dispatch another delivery message when a task is updated while already delivered', function () {
    Event::fake([MessageSent::class]);

    $task = Task::factory()->create([
        'user_id' => $this->user->id,
        'state' => 'delivered',
        'review_eligible_until' => now()->addHours(24),
    ]);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.tasks.update', $task), [
            'state' => 'delivered',
            'task_name' => 'Still Delivered',
        ])
        ->assertRedirect(route('admin.tasks.index'));

    Event::assertNotDispatched(MessageSent::class);
});

it('shows can_review as true within the review window and false once it expires', function () {
    $stillEligible = Task::factory()->create([
        'user_id' => $this->user->id,
        'state' => 'delivered',
        'task_name' => 'Eligible Task',
        'review_eligible_until' => now()->addHours(12),
    ]);

    $expired = Task::factory()->create([
        'user_id' => $this->user->id,
        'state' => 'delivered',
        'task_name' => 'Expired Task',
        'review_eligible_until' => now()->subHour(),
    ]);

    $response = $this->actingAs($this->user)->get(route('dashboard'))->assertSuccessful();

    $tasks = collect($response->original->getData()['page']['props']['tasks']);

    expect($tasks->firstWhere('id', $stillEligible->id)['can_review'])->toBeTrue();
    expect($tasks->firstWhere('id', $expired->id)['can_review'])->toBeFalse();
});

it('shows can_review as false for a task that is not yet delivered', function () {
    $task = Task::factory()->create([
        'user_id' => $this->user->id,
        'state' => 'in progress',
        'review_eligible_until' => null,
    ]);

    $response = $this->actingAs($this->user)->get(route('dashboard'))->assertSuccessful();

    $tasks = collect($response->original->getData()['page']['props']['tasks']);

    expect($tasks->firstWhere('id', $task->id)['can_review'])->toBeFalse();
});
