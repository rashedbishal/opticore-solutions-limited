<?php

use App\Models\Admin;
use App\Models\Testimonial;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('public');
    $this->admin = Admin::factory()->create();
});

function createTestimonial(array $overrides = []): Testimonial
{
    return Testimonial::create(array_merge([
        'name' => 'Jane Client',
        'company' => 'Acme Inc',
        'role' => 'CEO',
        'rating' => 5,
        'comment' => 'Outstanding work from the team.',
        'sort_order' => 0,
        'is_active' => true,
    ], $overrides));
}

it('lists testimonials on the admin index page', function () {
    createTestimonial(['name' => 'Listed Testimonial']);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.testimonials.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Testimonial/Index')
            ->where('testimonials.data.0.name', 'Listed Testimonial')
        );
});

it('renders the create testimonial page', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.testimonials.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Testimonial/Create'));
});

it('creates a testimonial with an image and clears the homepage cache', function () {
    Cache::put('home.testimonials', ['stale' => true], now()->addMinutes(60));

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.testimonials.store'), [
            'name' => 'New Client',
            'company' => 'New Co',
            'role' => 'Founder',
            'rating' => 4,
            'comment' => 'Great experience working with them.',
            'sort_order' => 1,
            'is_active' => true,
            'image' => UploadedFile::fake()->image('testimonial.jpg'),
        ])
        ->assertRedirect(route('admin.testimonials.index'));

    $testimonial = Testimonial::query()->where('name', 'New Client')->first();

    expect($testimonial)->not->toBeNull();
    expect($testimonial->image_path)->toStartWith('testimonials/');
    expect(Cache::get('home.testimonials'))->toBeNull();

    Storage::disk('public')->assertExists($testimonial->image_path);
});

it('rejects testimonial creation with missing required fields', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.testimonials.store'), [])
        ->assertInvalid(['name', 'company', 'role', 'rating', 'comment']);
});

it('rejects a testimonial rating outside the allowed range', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.testimonials.store'), [
            'name' => 'Jane',
            'company' => 'Acme',
            'role' => 'CEO',
            'rating' => 6,
            'comment' => 'Too high a rating.',
        ])
        ->assertInvalid(['rating']);
});

it('rejects a non-image file for the testimonial image', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.testimonials.store'), [
            'name' => 'Jane',
            'company' => 'Acme',
            'role' => 'CEO',
            'rating' => 5,
            'comment' => 'A valid comment.',
            'image' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ])
        ->assertInvalid(['image']);
});

it('renders the edit testimonial page with existing data', function () {
    $testimonial = createTestimonial(['name' => 'Editable Client']);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.testimonials.edit', $testimonial))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Testimonial/Edit')
            ->where('testimonial.name', 'Editable Client')
        );
});

it('updates a testimonial and replaces its image', function () {
    $oldPath = UploadedFile::fake()->image('old.jpg')->store('testimonials', 'public');
    $testimonial = createTestimonial(['image_path' => $oldPath]);

    Cache::put('home.testimonials', ['stale' => true], now()->addMinutes(60));

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.testimonials.update', $testimonial), [
            'name' => 'Updated Name',
            'company' => 'Updated Co',
            'role' => 'CTO',
            'rating' => 3,
            'comment' => 'Updated comment text.',
            'sort_order' => 5,
            'is_active' => false,
            'image' => UploadedFile::fake()->image('new.jpg'),
        ])
        ->assertRedirect(route('admin.testimonials.index'));

    $testimonial->refresh();

    expect($testimonial->name)->toBe('Updated Name');
    expect($testimonial->rating)->toBe(3);
    expect($testimonial->is_active)->toBeFalse();
    expect($testimonial->image_path)->not->toBe($oldPath);
    expect(Cache::get('home.testimonials'))->toBeNull();

    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($testimonial->image_path);
});

it('toggles a testimonial active state via update', function () {
    $testimonial = createTestimonial(['is_active' => true]);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.testimonials.update', $testimonial), [
            'name' => $testimonial->name,
            'company' => $testimonial->company,
            'role' => $testimonial->role,
            'rating' => $testimonial->rating,
            'comment' => $testimonial->comment,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.testimonials.index'));

    expect($testimonial->fresh()->is_active)->toBeFalse();
});

it('reorders a testimonial via the sort_order field', function () {
    $testimonial = createTestimonial(['sort_order' => 0]);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.testimonials.update', $testimonial), [
            'name' => $testimonial->name,
            'company' => $testimonial->company,
            'role' => $testimonial->role,
            'rating' => $testimonial->rating,
            'comment' => $testimonial->comment,
            'sort_order' => 9,
        ])
        ->assertRedirect(route('admin.testimonials.index'));

    expect($testimonial->fresh()->sort_order)->toBe(9);
});

it('deletes a testimonial and removes its image from storage', function () {
    $path = UploadedFile::fake()->image('to-delete.jpg')->store('testimonials', 'public');
    $testimonial = createTestimonial(['image_path' => $path]);

    Cache::put('home.testimonials', ['stale' => true], now()->addMinutes(60));

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.testimonials.destroy', $testimonial))
        ->assertRedirect();

    $this->assertDatabaseMissing('testimonials', ['id' => $testimonial->id]);
    expect(Cache::get('home.testimonials'))->toBeNull();

    Storage::disk('public')->assertMissing($path);
});

it('only shows active testimonials on the homepage in sort order', function () {
    createTestimonial(['name' => 'Hidden One', 'is_active' => false, 'sort_order' => 0]);
    createTestimonial(['name' => 'Second Shown', 'is_active' => true, 'sort_order' => 2]);
    createTestimonial(['name' => 'First Shown', 'is_active' => true, 'sort_order' => 1]);

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Home/Index')
            ->where('testimonials.0.name', 'First Shown')
            ->where('testimonials.1.name', 'Second Shown')
            ->where('testimonials', fn ($testimonials) => collect($testimonials)->pluck('name')->doesntContain('Hidden One'))
        );
});
