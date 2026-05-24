<?php

use App\Models\Admin;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
    Storage::fake('public');
});

// --- Index ---
it('renders the portfolio index page', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.portfolios.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Portfolio/Index')
            ->has('portfolios')
        );
});

// --- Create ---
it('renders the portfolio create page with categories and sub-categories', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.portfolios.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Portfolio/Create')
            ->has('categories')
            ->has('subCategoriesByCategory')
        );
});

// --- Store ---
it('stores a portfolio item with an image upload', function () {
    $subCategory = PortfolioSubCategory::factory()->create(['category_slug' => 'graphic-design']);

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'title' => 'Logo Design Work',
            'sub_category_id' => $subCategory->id,
            'alt' => 'A great logo',
            'media' => UploadedFile::fake()->image('logo.jpg', 800, 600),
        ])
        ->assertRedirect(route('admin.portfolios.index'));

    $portfolio = Portfolio::where('title', 'Logo Design Work')->first();
    expect($portfolio)->not->toBeNull();
    expect($portfolio->media_type)->toBe('image');
    Storage::disk('public')->assertExists($portfolio->media_path);
});

it('detects video media type from uploaded video file', function () {
    $subCategory = PortfolioSubCategory::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'title' => 'Showreel',
            'sub_category_id' => $subCategory->id,
            'media' => UploadedFile::fake()->create('reel.mp4', 5000, 'video/mp4'),
        ]);

    $portfolio = Portfolio::where('title', 'Showreel')->first();
    expect($portfolio)->not->toBeNull()
        ->and($portfolio->media_type)->toBe('video');
});

it('requires a media file when storing a portfolio', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'title' => 'No Media',
        ])
        ->assertInvalid(['media']);
});

it('requires a title when storing a portfolio', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'media' => UploadedFile::fake()->image('test.jpg'),
        ])
        ->assertInvalid(['title']);
});

it('rejects unsupported media file types', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'title' => 'Bad File',
            'media' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        ])
        ->assertInvalid(['media']);
});

it('derives category_slug from the sub-category on store', function () {
    $subCategory = PortfolioSubCategory::factory()->create(['category_slug' => 'web-development']);

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'title' => 'Web Project',
            'sub_category_id' => $subCategory->id,
            'media' => UploadedFile::fake()->image('project.jpg'),
        ]);

    $this->assertDatabaseHas('portfolios', [
        'title' => 'Web Project',
        'category' => 'web-development',
    ]);
});

// --- Edit ---
it('renders the portfolio edit page with the portfolio data', function () {
    $portfolio = Portfolio::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.portfolios.edit', $portfolio))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Portfolio/Edit')
            ->where('portfolio.id', $portfolio->id)
            ->where('portfolio.title', $portfolio->title)
        );
});

// --- Update ---
it('updates a portfolio item title', function () {
    $portfolio = Portfolio::factory()->create(['title' => 'Old Title']);
    $subCategory = PortfolioSubCategory::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.portfolios.update', $portfolio), [
            'title' => 'New Title',
            'sub_category_id' => $subCategory->id,
        ])
        ->assertRedirect(route('admin.portfolios.index'));

    $this->assertDatabaseHas('portfolios', [
        'id' => $portfolio->id,
        'title' => 'New Title',
    ]);
});

it('replaces the media file when a new one is uploaded on update', function () {
    $oldFile = UploadedFile::fake()->image('old.jpg');
    $oldPath = $oldFile->store('portfolios', 'public');
    $portfolio = Portfolio::factory()->create(['media_path' => $oldPath]);

    $subCategory = PortfolioSubCategory::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.portfolios.update', $portfolio), [
            'title' => $portfolio->title,
            'sub_category_id' => $subCategory->id,
            'media' => UploadedFile::fake()->image('new.jpg'),
        ]);

    Storage::disk('public')->assertMissing($oldPath);
    $portfolio->refresh();
    expect($portfolio->media_path)->not->toBe($oldPath);
});

// --- Destroy ---
it('deletes a portfolio item and removes the media file', function () {
    $file = UploadedFile::fake()->image('artwork.jpg');
    $path = $file->store('portfolios', 'public');
    $portfolio = Portfolio::factory()->create(['media_path' => $path]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.portfolios.destroy', $portfolio))
        ->assertRedirect();

    $this->assertDatabaseMissing('portfolios', ['id' => $portfolio->id]);
    Storage::disk('public')->assertMissing($path);
});

it('can delete a portfolio item without a media file', function () {
    $portfolio = Portfolio::factory()->create(['media_path' => null]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.portfolios.destroy', $portfolio))
        ->assertRedirect();

    $this->assertDatabaseMissing('portfolios', ['id' => $portfolio->id]);
});
