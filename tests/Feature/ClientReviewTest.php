<?php

use App\Models\ClientReview;
use App\Models\PortfolioSubCategory;
use App\Models\Task;
use App\Models\User;

/**
 * Tests for the public client review submission endpoint.
 *
 * This is security-critical: the controller enforces task ownership (IDOR),
 * review window expiry, task delivery state, and duplicate prevention.
 */

/**
 * Creates a delivered task within the 24-hour review window for a given user.
 */
function deliveredTask(User $user, ?PortfolioSubCategory $subCategory = null): Task
{
    $subCategory ??= PortfolioSubCategory::factory()->create();

    return Task::factory()->create([
        'user_id' => $user->id,
        'sub_category_id' => $subCategory->id,
        'category' => $subCategory->category_slug,
        'state' => 'delivered',
        'review_eligible_until' => now()->addHours(23),
    ]);
}

// --- Guest protection ---
it('requires authentication to submit a review', function () {
    $this->post(route('reviews.store'), [
        'task_id' => 1,
        'rating' => 5,
        'comment' => 'Great work!',
    ])->assertRedirect(route('login'));
});

// --- Happy path ---
it('allows a user to submit a review for their own delivered task within the window', function () {
    $user = User::factory()->create();
    $task = deliveredTask($user);

    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 5,
            'comment' => 'Absolutely fantastic work!',
            'price_range' => '$100-$200',
            'work_duration' => '3 days',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('client_reviews', [
        'task_id' => $task->id,
        'user_id' => $user->id,
        'rating' => 5,
        'comment' => 'Absolutely fantastic work!',
    ]);
});

it('marks the reviewer as a new client on their first delivered task', function () {
    $user = User::factory()->create();
    $task = deliveredTask($user);

    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 4,
            'comment' => 'Good work.',
        ]);

    $review = ClientReview::where('task_id', $task->id)->first();
    expect($review->client_type)->toBe('new');
});

it('marks the reviewer as a repeat client when they have other delivered tasks', function () {
    $user = User::factory()->create();

    // Previous delivered task — no review, just establishes repeat status
    Task::factory()->create([
        'user_id' => $user->id,
        'state' => 'delivered',
    ]);

    $task = deliveredTask($user);

    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 5,
            'comment' => 'Love your team!',
        ]);

    $review = ClientReview::where('task_id', $task->id)->first();
    expect($review->client_type)->toBe('repeat');
});

it('recalculates the sub-category rating after a review is submitted', function () {
    $subCategory = PortfolioSubCategory::factory()->create(['rating' => 0.0, 'reviews_count' => 0]);
    $user = User::factory()->create();
    $task = deliveredTask($user, $subCategory);

    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 4,
            'comment' => 'Good service.',
        ]);

    $subCategory->refresh();
    expect($subCategory->reviews_count)->toBe(1)
        ->and((float) $subCategory->rating)->toBe(4.0);
});

// --- IDOR protection ---
it('returns 403 when a user attempts to review a task belonging to another user', function () {
    $owner = User::factory()->create();
    $attacker = User::factory()->create();
    $task = deliveredTask($owner);

    $this->actingAs($attacker)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 5,
            'comment' => 'Trying to fake a review.',
        ])
        ->assertForbidden();

    $this->assertDatabaseMissing('client_reviews', ['task_id' => $task->id]);
});

// --- Review window expiry ---
it('returns 403 when the 24-hour review window has expired', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create([
        'user_id' => $user->id,
        'state' => 'delivered',
        'review_eligible_until' => now()->subMinutes(1),
    ]);

    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 5,
            'comment' => 'Too late.',
        ])
        ->assertForbidden();

    $this->assertDatabaseMissing('client_reviews', ['task_id' => $task->id]);
});

it('returns 403 when review_eligible_until has never been set', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create([
        'user_id' => $user->id,
        'state' => 'delivered',
        'review_eligible_until' => null,
    ]);

    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 5,
            'comment' => 'No window set.',
        ])
        ->assertForbidden();
});

// --- Task state guard ---
it('returns 403 when the task has not been delivered yet', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create([
        'user_id' => $user->id,
        'state' => 'pending',
        'review_eligible_until' => now()->addHours(24),
    ]);

    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 5,
            'comment' => 'Not delivered yet.',
        ])
        ->assertForbidden();
});

it('returns 403 when the task is in progress', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create([
        'user_id' => $user->id,
        'state' => 'in progress',
        'review_eligible_until' => now()->addHours(24),
    ]);

    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 5,
            'comment' => 'Still in progress.',
        ])
        ->assertForbidden();
});

// --- Duplicate review prevention ---
it('returns 409 when the user attempts to submit a second review for the same task', function () {
    $user = User::factory()->create();
    $task = deliveredTask($user);

    // First review succeeds
    ClientReview::create([
        'task_id' => $task->id,
        'user_id' => $user->id,
        'sub_category_id' => $task->sub_category_id,
        'category_slug' => $task->category,
        'username' => $user->name,
        'client_type' => 'new',
        'rating' => 5,
        'comment' => 'First review.',
        'sort_order' => 0,
    ]);

    // Second attempt must be rejected
    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 1,
            'comment' => 'Second attempt.',
        ])
        ->assertStatus(409);
});

// --- Validation ---
it('validates that rating is required and must be between 1 and 5', function () {
    $user = User::factory()->create();
    $task = deliveredTask($user);

    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 6,
            'comment' => 'Out of range.',
        ])
        ->assertInvalid(['rating']);
});

it('validates that comment is required', function () {
    $user = User::factory()->create();
    $task = deliveredTask($user);

    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 5,
        ])
        ->assertInvalid(['comment']);
});

it('validates that task_id must exist', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => 999999,
            'rating' => 5,
            'comment' => 'Ghost task.',
        ])
        ->assertInvalid(['task_id']);
});

it('rejects a comment exceeding 2000 characters', function () {
    $user = User::factory()->create();
    $task = deliveredTask($user);

    $this->actingAs($user)
        ->post(route('reviews.store'), [
            'task_id' => $task->id,
            'rating' => 5,
            'comment' => str_repeat('a', 2001),
        ])
        ->assertInvalid(['comment']);
});
