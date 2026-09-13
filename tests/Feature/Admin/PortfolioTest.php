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
            'media_source' => 'file',
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
            'media_source' => 'file',
            'media' => UploadedFile::fake()->create('reel.mp4', 5000, 'video/mp4'),
        ]);

    $portfolio = Portfolio::where('title', 'Showreel')->first();
    expect($portfolio)->not->toBeNull()
        ->and($portfolio->media_type)->toBe('video');
});

it('requires a media file when storing with file source', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'title' => 'No Media',
            'media_source' => 'file',
        ])
        ->assertInvalid(['media']);
});

it('requires a title when storing a portfolio', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'media_source' => 'file',
            'media' => UploadedFile::fake()->image('test.jpg'),
        ])
        ->assertInvalid(['title']);
});

it('rejects unsupported media file types', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'title' => 'Bad File',
            'media_source' => 'file',
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
            'media_source' => 'file',
            'media' => UploadedFile::fake()->image('project.jpg'),
        ]);

    $this->assertDatabaseHas('portfolios', [
        'title' => 'Web Project',
        'category' => 'web-development',
    ]);
});

// --- Store YouTube ---
it('stores a portfolio item with a youtube video url', function () {
    $subCategory = PortfolioSubCategory::factory()->create(['category_slug' => 'video-production']);

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'title' => 'Brand Promo',
            'sub_category_id' => $subCategory->id,
            'media_source' => 'youtube',
            'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ])
        ->assertRedirect(route('admin.portfolios.index'));

    $portfolio = Portfolio::where('title', 'Brand Promo')->first();
    expect($portfolio)->not->toBeNull();
    expect($portfolio->media_type)->toBe('youtube');
    expect($portfolio->youtube_video_id)->toBe('dQw4w9WgXcQ');
    expect($portfolio->media_path)->toBeNull();
});

it('also accepts youtu.be short urls', function () {
    $subCategory = PortfolioSubCategory::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'title' => 'Short URL Test',
            'sub_category_id' => $subCategory->id,
            'media_source' => 'youtube',
            'youtube_url' => 'https://youtu.be/dQw4w9WgXcQ',
        ])
        ->assertRedirect(route('admin.portfolios.index'));

    $portfolio = Portfolio::where('title', 'Short URL Test')->first();
    expect($portfolio->youtube_video_id)->toBe('dQw4w9WgXcQ');
});

it('requires a youtube url when media source is youtube', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'title' => 'Missing URL',
            'media_source' => 'youtube',
        ])
        ->assertInvalid(['youtube_url']);
});

it('requires media_source field to be present', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.portfolios.store'), [
            'title' => 'No Source',
            'media' => UploadedFile::fake()->image('test.jpg'),
        ])
        ->assertInvalid(['media_source']);
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
            'media_source' => 'file',
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
            'media_source' => 'file',
            'media' => UploadedFile::fake()->image('new.jpg'),
        ]);

    Storage::disk('public')->assertMissing($oldPath);
    $portfolio->refresh();
    expect($portfolio->media_path)->not->toBe($oldPath);
});

it('updates a portfolio to use a youtube video url', function () {
    $oldFile = UploadedFile::fake()->image('old.jpg');
    $oldPath = $oldFile->store('portfolios', 'public');
    $portfolio = Portfolio::factory()->create(['media_path' => $oldPath, 'media_type' => 'image']);
    $subCategory = PortfolioSubCategory::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.portfolios.update', $portfolio), [
            'title' => $portfolio->title,
            'sub_category_id' => $subCategory->id,
            'media_source' => 'youtube',
            'youtube_url' => 'https://youtu.be/dQw4w9WgXcQ',
        ])
        ->assertRedirect(route('admin.portfolios.index'));

    // Old file should be deleted when switching to YouTube
    Storage::disk('public')->assertMissing($oldPath);

    $portfolio->refresh();
    expect($portfolio->media_type)->toBe('youtube');
    expect($portfolio->youtube_video_id)->toBe('dQw4w9WgXcQ');
    expect($portfolio->media_path)->toBeNull();
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

it('can delete a youtube portfolio item without error', function () {
    $portfolio = Portfolio::factory()->create([
        'media_path' => null,
        'media_type' => 'youtube',
        'youtube_video_id' => 'dQw4w9WgXcQ',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.portfolios.destroy', $portfolio))
        ->assertRedirect();

    $this->assertDatabaseMissing('portfolios', ['id' => $portfolio->id]);
});
