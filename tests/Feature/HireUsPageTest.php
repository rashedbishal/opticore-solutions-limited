<?php

use App\Models\Admin;
use App\Models\PortfolioSubCategory;
use Inertia\Testing\AssertableInertia as Assert;

it('renders hire us sub-categories from cms data', function () {
    $subCategory = PortfolioSubCategory::factory()->create([
        'category_slug' => 'graphic-design',
        'name' => 'Logo Design',
        'slug' => 'logo-design',
        'price' => '2500 BDT',
        'rating' => 4.9,
        'reviews_count' => 156,
        'image' => 'https://example.com/logo-design.jpg',
    ]);

    $this->get('/hire-us')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('HireUs')
            ->where('subCategories.graphic-design.0.name', $subCategory->name)
            ->where('subCategories.graphic-design.0.slug', $subCategory->slug)
            ->where('subCategories.graphic-design.0.price', $subCategory->price)
            ->where('subCategories.graphic-design.0.rating', 4.9)
            ->where('subCategories.graphic-design.0.reviews', 156)
            ->where('subCategories.graphic-design.0.image', $subCategory->image)
        );
});

it('allows admins to create update and delete hire us sub-categories', function () {
    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->post(route('admin.portfolio-sub-categories.store'), [
            'category_slug' => 'graphic-design',
            'name' => 'Thumbnail Design',
            'slug' => 'thumbnail-design',
            'description' => 'High-converting thumbnails for social media and video.',
            'price' => '300 BDT',
            'rating' => '4.8',
            'reviews_count' => 84,
            'image' => 'https://example.com/thumbnail.jpg',
            'sort_order' => 2,
        ])
        ->assertRedirect(route('admin.portfolio-sub-categories.index'));

    $subCategory = PortfolioSubCategory::query()->firstWhere('slug', 'thumbnail-design');

    expect($subCategory)->not->toBeNull();

    $this->actingAs($admin, 'admin')
        ->put(route('admin.portfolio-sub-categories.update', $subCategory), [
            'category_slug' => 'graphic-design',
            'name' => 'Thumbnail Design Pro',
            'slug' => 'thumbnail-design-pro',
            'description' => 'Updated description.',
            'price' => '500 BDT',
            'rating' => '5.0',
            'reviews_count' => 100,
            'image' => 'https://example.com/thumbnail-pro.jpg',
            'sort_order' => 1,
        ])
        ->assertRedirect(route('admin.portfolio-sub-categories.index'));

    $subCategory->refresh();

    expect($subCategory->name)->toBe('Thumbnail Design Pro');
    expect($subCategory->slug)->toBe('thumbnail-design-pro');
    expect($subCategory->price)->toBe('500 BDT');
    expect((float) $subCategory->rating)->toBe(5.0);
    expect($subCategory->reviews_count)->toBe(100);
    expect($subCategory->image)->toBe('https://example.com/thumbnail-pro.jpg');

    $this->actingAs($admin, 'admin')
        ->delete(route('admin.portfolio-sub-categories.destroy', $subCategory))
        ->assertRedirect();

    $this->assertDatabaseMissing('portfolio_sub_categories', [
        'id' => $subCategory->id,
    ]);
});
