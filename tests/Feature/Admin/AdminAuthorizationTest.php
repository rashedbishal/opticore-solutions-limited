<?php

use App\Models\Admin;
use App\Models\Blog;
use App\Models\Brand;
use App\Models\ClientReview;
use App\Models\Contact;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use App\Models\Task;

/**
 * Verifies that every admin route rejects unauthenticated visitors.
 *
 * This is the most critical authorization test: if a middleware is accidentally
 * removed from a route group, these tests catch it before production.
 */
beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

// --- Dashboard ---
it('blocks unauthenticated access to the admin dashboard', function () {
    $this->get('/admin')->assertRedirect(route('admin.login'));
});

// --- Brands ---
it('blocks unauthenticated GET to admin brands index', function () {
    $this->get(route('admin.brands.index'))->assertRedirect(route('admin.login'));
});

it('blocks unauthenticated POST to admin brands store', function () {
    $this->post(route('admin.brands.store'), ['name' => 'Test'])->assertRedirect(route('admin.login'));
    $this->assertDatabaseMissing('brands', ['name' => 'Test']);
});

it('blocks unauthenticated PUT to admin brands update', function () {
    $brand = Brand::factory()->create();

    $this->put(route('admin.brands.update', $brand), ['name' => 'Hacked'])->assertRedirect(route('admin.login'));
    $this->assertDatabaseMissing('brands', ['name' => 'Hacked']);
});

it('blocks unauthenticated DELETE to admin brands destroy', function () {
    $brand = Brand::factory()->create();

    $this->delete(route('admin.brands.destroy', $brand))->assertRedirect(route('admin.login'));
    $this->assertDatabaseHas('brands', ['id' => $brand->id]);
});

// --- Blogs ---
it('blocks unauthenticated GET to admin blogs index', function () {
    $this->get(route('admin.blogs.index'))->assertRedirect(route('admin.login'));
});

it('blocks unauthenticated POST to admin blogs store', function () {
    $this->post(route('admin.blogs.store'), ['title' => 'Injected Blog'])->assertRedirect(route('admin.login'));
    $this->assertDatabaseMissing('blogs', ['title' => 'Injected Blog']);
});

it('blocks unauthenticated DELETE to admin blogs destroy', function () {
    $blog = Blog::factory()->create();

    $this->delete(route('admin.blogs.destroy', $blog))->assertRedirect(route('admin.login'));
    $this->assertDatabaseHas('blogs', ['id' => $blog->id]);
});

// --- Portfolios ---
it('blocks unauthenticated GET to admin portfolios index', function () {
    $this->get(route('admin.portfolios.index'))->assertRedirect(route('admin.login'));
});

it('blocks unauthenticated DELETE to admin portfolios destroy', function () {
    $portfolio = Portfolio::factory()->create();

    $this->delete(route('admin.portfolios.destroy', $portfolio))->assertRedirect(route('admin.login'));
    $this->assertDatabaseHas('portfolios', ['id' => $portfolio->id]);
});

// --- Sub-Categories ---
it('blocks unauthenticated GET to admin sub-categories index', function () {
    $this->get(route('admin.sub-categories.index'))->assertRedirect(route('admin.login'));
});

it('blocks unauthenticated POST to admin sub-categories store', function () {
    $this->post(route('admin.sub-categories.store'), ['name' => 'Injected'])->assertRedirect(route('admin.login'));
    $this->assertDatabaseMissing('portfolio_sub_categories', ['name' => 'Injected']);
});

it('blocks unauthenticated DELETE to admin sub-categories destroy', function () {
    $subCategory = PortfolioSubCategory::factory()->create();

    $this->delete(route('admin.sub-categories.destroy', $subCategory))->assertRedirect(route('admin.login'));
    $this->assertDatabaseHas('portfolio_sub_categories', ['id' => $subCategory->id]);
});

// --- Tasks ---
it('blocks unauthenticated GET to admin tasks index', function () {
    $this->get(route('admin.tasks.index'))->assertRedirect(route('admin.login'));
});

it('blocks unauthenticated POST to admin tasks store', function () {
    $this->post(route('admin.tasks.store'), ['task_name' => 'Injected'])->assertRedirect(route('admin.login'));
    $this->assertDatabaseMissing('tasks', ['task_name' => 'Injected']);
});

it('blocks unauthenticated DELETE to admin tasks destroy', function () {
    $task = Task::factory()->create();

    $this->delete(route('admin.tasks.destroy', $task))->assertRedirect(route('admin.login'));
    $this->assertDatabaseHas('tasks', ['id' => $task->id]);
});

// --- Users ---
it('blocks unauthenticated GET to admin users index', function () {
    $this->get(route('admin.users.index'))->assertRedirect(route('admin.login'));
});

it('blocks unauthenticated POST to admin users store', function () {
    $this->post(route('admin.users.store'), [
        'name' => 'Hacker',
        'email' => 'hacker@example.com',
        'password' => 'password123',
    ])->assertRedirect(route('admin.login'));
    $this->assertDatabaseMissing('admins', ['email' => 'hacker@example.com'], 'admin');
});

it('blocks unauthenticated DELETE to admin users destroy', function () {
    $admin = Admin::factory()->create();

    $this->delete(route('admin.users.destroy', $admin))->assertRedirect(route('admin.login'));
    $this->assertDatabaseHas('admins', ['id' => $admin->id], 'admin');
});

// --- Contacts ---
it('blocks unauthenticated GET to admin contacts index', function () {
    $this->get(route('admin.contacts.index'))->assertRedirect(route('admin.login'));
});

it('blocks unauthenticated DELETE to admin contacts destroy', function () {
    $contact = Contact::factory()->create();

    $this->delete(route('admin.contacts.destroy', $contact))->assertRedirect(route('admin.login'));
    $this->assertDatabaseHas('contacts', ['id' => $contact->id]);
});

// --- Client Reviews ---
it('blocks unauthenticated GET to admin client-reviews index', function () {
    $this->get(route('admin.client-reviews.index'))->assertRedirect(route('admin.login'));
});

it('blocks unauthenticated DELETE to admin client-reviews destroy', function () {
    $task = Task::factory()->create();
    $review = ClientReview::create([
        'task_id' => $task->id,
        'user_id' => $task->user_id,
        'sub_category_id' => $task->sub_category_id,
        'category_slug' => $task->category,
        'username' => 'Test User',
        'client_type' => 'new',
        'rating' => 5,
        'comment' => 'Great service',
        'sort_order' => 0,
    ]);

    $this->delete(route('admin.client-reviews.destroy', $review))->assertRedirect(route('admin.login'));
    $this->assertDatabaseHas('client_reviews', ['id' => $review->id]);
});

// --- Resources with no "show" view (no controller show() method exists) ---
// Route::resource() registers a "show" route by default; without ->except(['show'])
// this would 500 ("Call to undefined method ...::show()") instead of cleanly
// rejecting GET (405, since PUT/PATCH/DELETE still match the same URI).
it('rejects GET rather than crashing when an admin opens a direct link to a resource with no show view', function (string $routeUri) {
    $this->actingAs($this->admin, 'admin')
        ->get($routeUri)
        ->assertStatus(405);
})->with([
    fn () => '/admin/blogs/'.Blog::factory()->create()->id,
    fn () => '/admin/portfolios/'.Portfolio::factory()->create()->id,
    fn () => '/admin/sub-categories/'.PortfolioSubCategory::factory()->create()->id,
    fn () => '/admin/tasks/'.Task::factory()->create()->id,
    fn () => '/admin/users/'.Admin::factory()->create()->id,
]);
