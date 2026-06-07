<?php

use App\Models\Admin;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    $this->admin = Admin::factory()->create();
});

it('rejects sub-category creation with missing required fields', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.sub-categories.store'), [])
        ->assertInvalid(['category_slug', 'name']);
});

it('rejects sub-category creation with an invalid category slug', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.sub-categories.store'), [
            'category_slug' => 'not-a-real-category',
            'name' => 'Some Service',
        ])
        ->assertInvalid(['category_slug']);
});

it('rejects sub-category creation with a duplicate slug', function () {
    PortfolioSubCategory::factory()->create(['slug' => 'logo-design']);

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.sub-categories.store'), [
            'category_slug' => 'graphic-design',
            'name' => 'Logo Design Two',
            'slug' => 'logo-design',
        ])
        ->assertInvalid(['slug']);
});

it('adds media to a sub-category gallery', function () {
    $subCategory = PortfolioSubCategory::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.sub-categories.gallery.store', $subCategory), [
            'media' => UploadedFile::fake()->image('gallery-item.jpg'),
            'caption' => 'A sample caption',
        ])
        ->assertRedirect();

    $portfolio = Portfolio::query()->where('sub_category_id', $subCategory->id)->first();

    expect($portfolio)->not->toBeNull();
    expect($portfolio->title)->toBe('A sample caption');
    expect($portfolio->category)->toBe($subCategory->category_slug);
    expect($portfolio->media_type)->toBe('image');

    Storage::disk('public')->assertExists($portfolio->media_path);
});

it('detects video media type when adding gallery items', function () {
    $subCategory = PortfolioSubCategory::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.sub-categories.gallery.store', $subCategory), [
            'media' => UploadedFile::fake()->create('clip.mp4', 1000, 'video/mp4'),
        ])
        ->assertRedirect();

    $portfolio = Portfolio::query()->where('sub_category_id', $subCategory->id)->first();

    expect($portfolio->media_type)->toBe('video');
    expect($portfolio->title)->toBe($subCategory->name);
});

it('rejects gallery uploads without a media file', function () {
    $subCategory = PortfolioSubCategory::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.sub-categories.gallery.store', $subCategory), [])
        ->assertInvalid(['media']);
});

it('removes media from a sub-category gallery and deletes the file', function () {
    $subCategory = PortfolioSubCategory::factory()->create();
    $path = UploadedFile::fake()->image('to-delete.jpg')->store('portfolios', 'public');

    $portfolio = Portfolio::create([
        'title' => 'To Delete',
        'category' => $subCategory->category_slug,
        'sub_category_id' => $subCategory->id,
        'alt' => 'To Delete',
        'media_path' => $path,
        'media_type' => 'image',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.sub-categories.gallery.destroy', [$subCategory, $portfolio]))
        ->assertRedirect();

    $this->assertDatabaseMissing('portfolios', ['id' => $portfolio->id]);
    Storage::disk('public')->assertMissing($path);
});

it('returns 404 when deleting gallery media that does not belong to the sub-category', function () {
    $subCategory = PortfolioSubCategory::factory()->create();
    $otherSubCategory = PortfolioSubCategory::factory()->create();

    $portfolio = Portfolio::create([
        'title' => 'Belongs Elsewhere',
        'category' => $otherSubCategory->category_slug,
        'sub_category_id' => $otherSubCategory->id,
        'alt' => 'Belongs Elsewhere',
        'media_path' => 'portfolios/elsewhere.jpg',
        'media_type' => 'image',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.sub-categories.gallery.destroy', [$subCategory, $portfolio]))
        ->assertNotFound();

    $this->assertDatabaseHas('portfolios', ['id' => $portfolio->id]);
});

it('requires exactly six description points when updating a sub-category', function () {
    $subCategory = PortfolioSubCategory::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.sub-categories.update', $subCategory), [
            'category_slug' => $subCategory->category_slug,
            'name' => $subCategory->name,
            'description_points' => [
                ['label' => 'Only One', 'icon' => 'Palette'],
            ],
        ])
        ->assertInvalid(['description_points']);
});

it('rejects an unknown icon for description points when updating a sub-category', function () {
    $subCategory = PortfolioSubCategory::factory()->create();

    $points = array_fill(0, 6, ['label' => 'Point', 'icon' => 'NotAnAllowedIcon']);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.sub-categories.update', $subCategory), [
            'category_slug' => $subCategory->category_slug,
            'name' => $subCategory->name,
            'description_points' => $points,
        ])
        ->assertInvalid(['description_points.0.icon']);
});

it('requires a question and answer for each provided faq when updating a sub-category', function () {
    $subCategory = PortfolioSubCategory::factory()->create();

    $points = [
        ['label' => 'Custom Designs', 'icon' => 'Palette'],
        ['label' => 'Fast Turnaround', 'icon' => 'Clock'],
        ['label' => 'Expert Consultation', 'icon' => 'MessageSquare'],
        ['label' => 'Source Files Included', 'icon' => 'FileText'],
        ['label' => 'Commercial License', 'icon' => 'Shield'],
        ['label' => 'Revisions Guaranteed', 'icon' => 'CheckCircle'],
    ];

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.sub-categories.update', $subCategory), [
            'category_slug' => $subCategory->category_slug,
            'name' => $subCategory->name,
            'description_points' => $points,
            'faqs' => [
                ['question' => 'Only a question, no answer'],
            ],
        ])
        ->assertInvalid(['faqs.0.answer']);
});

it('persists plans and faqs when updating a sub-category', function () {
    $subCategory = PortfolioSubCategory::factory()->create();

    $points = [
        ['label' => 'Custom Designs', 'icon' => 'Palette'],
        ['label' => 'Fast Turnaround', 'icon' => 'Clock'],
        ['label' => 'Expert Consultation', 'icon' => 'MessageSquare'],
        ['label' => 'Source Files Included', 'icon' => 'FileText'],
        ['label' => 'Commercial License', 'icon' => 'Shield'],
        ['label' => 'Revisions Guaranteed', 'icon' => 'CheckCircle'],
    ];

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.sub-categories.update', $subCategory), [
            'category_slug' => $subCategory->category_slug,
            'name' => $subCategory->name,
            'slug' => $subCategory->slug,
            'description_points' => $points,
            'plans' => [
                'basic' => ['price' => '$50', 'delivery' => '2 Days', 'features' => ['One feature']],
            ],
            'faqs' => [
                ['question' => 'How long does it take?', 'answer' => 'About two days.'],
            ],
        ])
        ->assertRedirect(route('admin.sub-categories.index'));

    $subCategory->refresh();

    expect($subCategory->plans['basic']['price'])->toBe('$50');
    expect($subCategory->faqs[0]['question'])->toBe('How long does it take?');
    expect($subCategory->description_points)->toHaveCount(6);
});
