<?php

use App\Models\Admin;
use App\Models\Category;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

it('lists categories for the admin', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.categories.index'))
        ->assertOk();
});

it('creates a category', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.categories.store'), [
            'slug' => 'photography',
            'label' => 'Photography',
            'description' => 'Professional photo shoots and editing.',
            'sort_order' => 5,
        ])
        ->assertRedirect(route('admin.categories.index'));

    $this->assertDatabaseHas('categories', [
        'slug' => 'photography',
        'label' => 'Photography',
        'sort_order' => 5,
    ]);
});

it('rejects category creation with missing required fields', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.categories.store'), [])
        ->assertInvalid(['slug', 'label']);
});

it('rejects category creation with a duplicate slug', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.categories.store'), [
            'slug' => 'graphic-design',
            'label' => 'Graphic Design Again',
        ])
        ->assertInvalid(['slug']);
});

it('rejects category creation with an invalid slug format', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.categories.store'), [
            'slug' => 'Not A Slug!',
            'label' => 'Bad Slug',
        ])
        ->assertInvalid(['slug']);
});

it('updates a category label, description, and sort order', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.categories.update', $category), [
            'label' => 'Graphic Design Updated',
            'description' => 'Updated description.',
            'sort_order' => 10,
        ])
        ->assertRedirect(route('admin.categories.index'));

    $category->refresh();

    expect($category->label)->toBe('Graphic Design Updated');
    expect($category->description)->toBe('Updated description.');
    expect($category->sort_order)->toBe(10);
});

it('keeps the slug unchanged when updating a category', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.categories.update', $category), [
            'slug' => 'attempted-change',
            'label' => 'Graphic Design',
            'description' => $category->description,
            'sort_order' => $category->sort_order,
        ])
        ->assertRedirect(route('admin.categories.index'));

    expect($category->refresh()->slug)->toBe('graphic-design');
});

it('blocks deleting a category that still has sub-categories', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();
    PortfolioSubCategory::factory()->create(['category_slug' => 'graphic-design']);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.categories.destroy', $category))
        ->assertRedirect();

    $this->assertDatabaseHas('categories', ['id' => $category->id]);
});

it('blocks deleting a category that still has portfolio items', function () {
    $category = Category::query()->where('slug', 'web-development')->first();

    Portfolio::create([
        'title' => 'Sample Project',
        'category' => 'web-development',
        'alt' => 'Sample Project',
        'media_path' => 'portfolios/sample.jpg',
        'media_type' => 'image',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.categories.destroy', $category))
        ->assertRedirect();

    $this->assertDatabaseHas('categories', ['id' => $category->id]);
});

it('deletes a category that is not referenced anywhere', function () {
    $category = Category::query()->create([
        'slug' => 'unused-category',
        'label' => 'Unused Category',
        'sort_order' => 99,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.categories.destroy', $category))
        ->assertRedirect();

    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
});

it('blocks unauthenticated GET to admin categories index', function () {
    $this->get(route('admin.categories.index'))->assertRedirect(route('admin.login'));
});

it('blocks unauthenticated POST to admin categories store', function () {
    $this->post(route('admin.categories.store'), [
        'slug' => 'injected',
        'label' => 'Injected',
    ])->assertRedirect(route('admin.login'));

    $this->assertDatabaseMissing('categories', ['slug' => 'injected']);
});

it('blocks unauthenticated DELETE to admin categories destroy', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();

    $this->delete(route('admin.categories.destroy', $category))->assertRedirect(route('admin.login'));

    $this->assertDatabaseHas('categories', ['id' => $category->id]);
});
