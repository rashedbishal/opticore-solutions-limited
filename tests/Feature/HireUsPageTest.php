<?php

use App\Models\Admin;
use App\Models\PortfolioSubCategory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

it('renders hire us sub-categories from cms data', function () {
    $subCategory = PortfolioSubCategory::factory()->create([
        'category_slug' => 'graphic-design',
        'name' => 'Logo Design',
        'slug' => 'logo-design',
        'price' => '2500 BDT',
        'rating' => 4.9,
        'reviews_count' => 156,
        'image' => 'sub-categories/logo-design.jpg',
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
            ->where('subCategories.graphic-design.0.image', asset('storage/'.$subCategory->image))
        );
});

it('allows admins to create update and delete hire us sub-categories', function () {
    Storage::fake('public');

    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->post(route('admin.sub-categories.store'), [
            'category_slug' => 'graphic-design',
            'name' => 'Thumbnail Design',
            'slug' => 'thumbnail-design',
            'description' => 'High-converting thumbnails for social media and video.',
            'price' => '300 BDT',
            'rating' => '4.8',
            'reviews_count' => 84,
            'image' => UploadedFile::fake()->create('thumbnail.jpg', 100, 'image/jpeg'),
            'sort_order' => 2,
        ])
        ->assertRedirect(route('admin.sub-categories.index'));

    $subCategory = PortfolioSubCategory::query()->firstWhere('slug', 'thumbnail-design');

    expect($subCategory)->not->toBeNull();
    expect($subCategory->image)->toStartWith('sub-categories/');

    Storage::disk('public')->assertExists($subCategory->image);

    $oldImagePath = $subCategory->image;

    $this->actingAs($admin, 'admin')
        ->put(route('admin.sub-categories.update', $subCategory), [
            'category_slug' => 'graphic-design',
            'name' => 'Thumbnail Design Pro',
            'slug' => 'thumbnail-design-pro',
            'description' => 'Updated description.',
            'price' => '500 BDT',
            'rating' => '5.0',
            'reviews_count' => 100,
            'image' => UploadedFile::fake()->create('thumbnail-pro.jpg', 100, 'image/jpeg'),
            'sort_order' => 1,
            'plans' => [
                'basic' => ['price' => '$99', 'delivery' => '3 Days', 'features' => ['Custom Thumbnail Design']],
                'standard' => ['price' => '$199', 'delivery' => '5 Days', 'features' => ['Custom Thumbnail Design', 'Multiple Revisions']],
                'premium' => ['price' => '$299', 'delivery' => '7 Days', 'features' => ['Custom Thumbnail Design', 'Multiple Revisions', 'Priority Support']],
            ],
            'description_points' => [
                ['label' => 'Custom Designs', 'icon' => 'Palette'],
                ['label' => 'Fast Turnaround', 'icon' => 'Clock'],
                ['label' => 'Expert Consultation', 'icon' => 'MessageSquare'],
                ['label' => 'Source Files Included', 'icon' => 'FileText'],
                ['label' => 'Commercial License', 'icon' => 'Shield'],
                ['label' => 'Revisions Guaranteed', 'icon' => 'CheckCircle'],
            ],
        ])
        ->assertRedirect(route('admin.sub-categories.index'));

    $subCategory->refresh();

    expect($subCategory->name)->toBe('Thumbnail Design Pro');
    expect($subCategory->slug)->toBe('thumbnail-design-pro');
    expect($subCategory->price)->toBe('500 BDT');
    expect((float) $subCategory->rating)->toBe(5.0);
    expect($subCategory->reviews_count)->toBe(100);
    expect($subCategory->image)->toStartWith('sub-categories/');

    Storage::disk('public')->assertMissing($oldImagePath);
    Storage::disk('public')->assertExists($subCategory->image);

    $finalImagePath = $subCategory->image;

    $this->actingAs($admin, 'admin')
        ->delete(route('admin.sub-categories.destroy', $subCategory))
        ->assertRedirect();

    $this->assertDatabaseMissing('portfolio_sub_categories', [
        'id' => $subCategory->id,
    ]);

    Storage::disk('public')->assertMissing($finalImagePath);
});
