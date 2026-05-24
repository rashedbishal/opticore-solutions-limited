<?php

use App\Models\Admin;
use App\Models\ClientReview;
use App\Models\PortfolioSubCategory;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

// --- Index ---
it('renders the client reviews index page', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.client-reviews.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ClientReview/Index')
            ->has('grouped')
        );
});

// --- Destroy ---
it('deletes a client review', function () {
    $task = Task::factory()->create();
    $review = ClientReview::create([
        'task_id' => $task->id,
        'user_id' => $task->user_id,
        'sub_category_id' => $task->sub_category_id,
        'category_slug' => $task->category,
        'username' => 'Test Reviewer',
        'client_type' => 'new',
        'rating' => 4,
        'comment' => 'Great work!',
        'sort_order' => 0,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.client-reviews.destroy', $review))
        ->assertRedirect();

    $this->assertDatabaseMissing('client_reviews', ['id' => $review->id]);
});

it('deletes the review image file when a review is removed', function () {
    Storage::fake('public');

    $imagePath = 'tasks/review-image.jpg';
    Storage::disk('public')->put($imagePath, 'fake-content');

    $task = Task::factory()->create();
    $review = ClientReview::create([
        'task_id' => $task->id,
        'user_id' => $task->user_id,
        'sub_category_id' => $task->sub_category_id,
        'category_slug' => $task->category,
        'username' => 'Reviewer',
        'client_type' => 'new',
        'rating' => 5,
        'comment' => 'Excellent!',
        'image_path' => $imagePath,
        'sort_order' => 0,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.client-reviews.destroy', $review));

    Storage::disk('public')->assertMissing($imagePath);
});

it('recalculates the sub-category rating and count after a review is deleted', function () {
    $subCategory = PortfolioSubCategory::factory()->create(['rating' => 4.0, 'reviews_count' => 2]);
    $user = User::factory()->create();
    $task = Task::factory()->create([
        'user_id' => $user->id,
        'sub_category_id' => $subCategory->id,
        'category' => $subCategory->category_slug,
    ]);

    // First review (5 stars — kept)
    ClientReview::create([
        'task_id' => $task->id,
        'user_id' => $user->id,
        'sub_category_id' => $subCategory->id,
        'category_slug' => $subCategory->category_slug,
        'username' => 'Reviewer A',
        'client_type' => 'new',
        'rating' => 5,
        'comment' => 'Great!',
        'sort_order' => 0,
    ]);

    // Second review (to be deleted)
    $task2 = Task::factory()->create([
        'user_id' => User::factory()->create()->id,
        'sub_category_id' => $subCategory->id,
        'category' => $subCategory->category_slug,
    ]);
    $reviewToDelete = ClientReview::create([
        'task_id' => $task2->id,
        'user_id' => $task2->user_id,
        'sub_category_id' => $subCategory->id,
        'category_slug' => $subCategory->category_slug,
        'username' => 'Reviewer B',
        'client_type' => 'new',
        'rating' => 3,
        'comment' => 'Okay.',
        'sort_order' => 1,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.client-reviews.destroy', $reviewToDelete));

    $subCategory->refresh();
    expect($subCategory->reviews_count)->toBe(1)
        ->and((float) $subCategory->rating)->toBe(5.0);
});

// --- Reorder ---
it('updates the sort order of reviews', function () {
    $task = Task::factory()->create();
    $reviewA = ClientReview::create([
        'task_id' => $task->id,
        'user_id' => $task->user_id,
        'sub_category_id' => $task->sub_category_id,
        'category_slug' => $task->category,
        'username' => 'A',
        'client_type' => 'new',
        'rating' => 5,
        'comment' => 'A review.',
        'sort_order' => 0,
    ]);
    $task2 = Task::factory()->create();
    $reviewB = ClientReview::create([
        'task_id' => $task2->id,
        'user_id' => $task2->user_id,
        'sub_category_id' => $task2->sub_category_id,
        'category_slug' => $task2->category,
        'username' => 'B',
        'client_type' => 'new',
        'rating' => 4,
        'comment' => 'B review.',
        'sort_order' => 1,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.client-reviews.reorder'), [
            'order' => [
                ['id' => $reviewA->id, 'sort_order' => 10],
                ['id' => $reviewB->id, 'sort_order' => 5],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('client_reviews', ['id' => $reviewA->id, 'sort_order' => 10]);
    $this->assertDatabaseHas('client_reviews', ['id' => $reviewB->id, 'sort_order' => 5]);
});

it('validates the reorder payload', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.client-reviews.reorder'), ['order' => 'not-an-array'])
        ->assertInvalid(['order']);
});
