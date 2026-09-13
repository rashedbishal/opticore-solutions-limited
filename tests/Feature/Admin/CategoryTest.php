<?php

use App\Models\Admin;
use App\Models\Category;
use App\Models\CategoryPortfolioItem;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
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

it('accepts a description up to the validated 500-character max without a db error', function () {
    // Regression test: `description` used to be varchar(255) while this
    // validation rule allowed up to 500 — Postgres rejected the insert
    // outright instead of truncating, producing an unhandled 500.
    $longDescription = str_repeat('a', 500);

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.categories.store'), [
            'label' => 'Long Description Category',
            'description' => $longDescription,
        ])
        ->assertRedirect(route('admin.categories.index'));

    $this->assertDatabaseHas('categories', [
        'label' => 'Long Description Category',
        'description' => $longDescription,
    ]);
});

it('accepts an updated description up to the validated 500-character max without a db error', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();
    $longDescription = str_repeat('b', 500);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.categories.update', $category), [
            'label' => $category->label,
            'description' => $longDescription,
        ])
        ->assertRedirect(route('admin.categories.index'));

    expect($category->refresh()->description)->toBe($longDescription);
});

it('rejects category creation with missing required fields', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.categories.store'), [])
        ->assertInvalid(['label']);
});

it('auto-generates the slug from the label when none is provided', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.categories.store'), [
            'label' => 'Motion Graphics & Animation',
        ])
        ->assertRedirect(route('admin.categories.index'));

    $this->assertDatabaseHas('categories', [
        'label' => 'Motion Graphics & Animation',
        'slug' => 'motion-graphics-animation',
    ]);
});

it('appends a numeric suffix instead of crashing when two labels auto-generate the same slug', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.categories.store'), ['label' => 'Motion Graphics'])
        ->assertRedirect(route('admin.categories.index'));

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.categories.store'), ['label' => 'Motion Graphics!!!'])
        ->assertRedirect(route('admin.categories.index'));

    $this->assertDatabaseHas('categories', ['label' => 'Motion Graphics', 'slug' => 'motion-graphics']);
    $this->assertDatabaseHas('categories', ['label' => 'Motion Graphics!!!', 'slug' => 'motion-graphics-2']);
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

// --- Marketing page fields (merged in from the former Service model) ---

it('rejects an icon outside the allowed list when updating a category', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.categories.update', $category), [
            'label' => $category->label,
            'icon' => 'NotAnAllowedIcon',
        ])
        ->assertInvalid(['icon']);
});

it('rejects a color outside the allowed palette when updating a category', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.categories.update', $category), [
            'label' => $category->label,
            'color' => 'not-a-real-color',
        ])
        ->assertInvalid(['color']);
});

it('requires a long description when publishing a category', function () {
    $category = Category::query()->create(['slug' => 'unpublished-category', 'label' => 'Unpublished Category']);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.categories.update', $category), [
            'label' => $category->label,
            'is_active' => true,
            'long_description' => '',
        ])
        ->assertInvalid(['long_description']);

    expect($category->refresh()->is_active)->toBeFalse();
});

it('allows publishing a category once a long description is provided', function () {
    $category = Category::query()->create(['slug' => 'publishable-category', 'label' => 'Publishable Category']);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.categories.update', $category), [
            'label' => $category->label,
            'is_active' => true,
            'long_description' => 'A full hero paragraph for the marketing page.',
        ])
        ->assertRedirect(route('admin.categories.index'));

    $category->refresh();
    expect($category->is_active)->toBeTrue();
    expect($category->long_description)->toBe('A full hero paragraph for the marketing page.');
});

it('preserves the other headings sections when only one section is submitted', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();
    $originalProcessHeading = $category->headings['process'];

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.categories.update', $category), [
            'label' => $category->label,
            'headings' => [
                'capabilities' => ['eyebrow' => 'New Eyebrow', 'title' => 'New Title'],
            ],
        ])
        ->assertRedirect(route('admin.categories.index'));

    $category->refresh();
    expect($category->headings['capabilities']['title'])->toBe('New Title');
    expect($category->headings['process'])->toBe($originalProcessHeading);
});

it('persists headings, sub_services, reasons, process, color, and the active flag when updating a category', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.categories.update', $category), [
            'label' => $category->label,
            'is_active' => false,
            'color' => 'teal',
            'headings' => [
                'capabilities' => ['eyebrow' => 'Scope', 'title' => 'What We Do'],
            ],
            'sub_services' => [
                ['title' => 'Sub One', 'description' => 'Sub one description'],
            ],
            'reasons' => [
                ['title' => 'Reason One', 'description' => 'Reason one description'],
            ],
            'process' => [
                ['title' => 'Step One', 'description' => 'Step one description'],
            ],
        ])
        ->assertRedirect(route('admin.categories.index'));

    $category->refresh();

    expect($category->is_active)->toBeFalse();
    expect($category->color)->toBe('teal');
    expect($category->headings['capabilities']['title'])->toBe('What We Do');
    expect($category->sub_services[0]['title'])->toBe('Sub One');
    expect($category->reasons[0]['title'])->toBe('Reason One');
    expect($category->process[0]['title'])->toBe('Step One');
});

it('requires a title and description for each provided sub_service when updating a category', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.categories.update', $category), [
            'label' => $category->label,
            'sub_services' => [
                ['title' => 'Only a title'],
            ],
        ])
        ->assertInvalid(['sub_services.0.description']);
});

it('clears the portfolio category cache when floating-card images are updated', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();
    Cache::put('portfolio.categories.index', 'stale', now()->addHour());

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.categories.floating-card-images.store', $category), [
            'image' => UploadedFile::fake()->image('card.webp'),
        ])
        ->assertRedirect();

    expect(Cache::has('portfolio.categories.index'))->toBeFalse();
});

it('clears the portfolio category cache when floating-card images are removed', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();
    $category->update([
        'floating_card_image' => UploadedFile::fake()->image('card.webp')->store('categories/floating', 'public'),
    ]);
    Cache::put('portfolio.categories.index', 'stale', now()->addHour());

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.categories.floating-card-images.destroy', $category))
        ->assertRedirect();

    expect(Cache::has('portfolio.categories.index'))->toBeFalse();
});

// --- Selected Work gallery (merged in from the former Service model) ---

it('adds an item to a category selected-work gallery', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.categories.gallery.store', $category), [
            'image' => UploadedFile::fake()->image('work.webp'),
            'title' => 'Launch Film',
            'category' => 'Brand Video',
            'description' => 'A cinematic launch film.',
        ])
        ->assertRedirect();

    $item = CategoryPortfolioItem::where('category_id', $category->id)
        ->where('title', 'Launch Film')
        ->first();

    expect($item)->not->toBeNull();
    expect($item->alt)->toBe('Launch Film');

    Storage::disk('public')->assertExists($item->image);
});

it('rejects gallery uploads without an image', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.categories.gallery.store', $category), [
            'title' => 'Launch Film',
            'category' => 'Brand Video',
        ])
        ->assertInvalid(['image']);
});

it('removes a gallery item from a category and deletes the file', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();
    $path = UploadedFile::fake()->image('to-delete.jpg')->store('categories', 'public');

    $item = $category->portfolioItems()->create([
        'title' => 'To Delete',
        'category' => 'Test',
        'alt' => 'To Delete',
        'image' => $path,
        'sort_order' => 0,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.categories.gallery.destroy', [$category, $item]))
        ->assertRedirect();

    $this->assertDatabaseMissing('category_portfolio_items', ['id' => $item->id]);
    Storage::disk('public')->assertMissing($path);
});

it('returns 404 when deleting a gallery item that does not belong to the category', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();
    $otherCategory = Category::query()->where('slug', 'web-development')->first();

    $item = $otherCategory->portfolioItems()->create([
        'title' => 'Belongs Elsewhere',
        'category' => 'Test',
        'alt' => 'Belongs Elsewhere',
        'image' => 'categories/elsewhere.jpg',
        'sort_order' => 0,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.categories.gallery.destroy', [$category, $item]))
        ->assertNotFound();

    $this->assertDatabaseHas('category_portfolio_items', ['id' => $item->id]);
});

it('deletes a category and its gallery image files', function () {
    $category = Category::query()->create([
        'slug' => 'unused-with-gallery',
        'label' => 'Unused With Gallery',
        'sort_order' => 99,
    ]);
    $path = UploadedFile::fake()->image('gone.jpg')->store('categories', 'public');

    $category->portfolioItems()->create([
        'title' => 'Gone',
        'category' => 'Test',
        'alt' => 'Gone',
        'image' => $path,
        'sort_order' => 0,
    ]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.categories.destroy', $category))
        ->assertRedirect();

    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    Storage::disk('public')->assertMissing($path);
});

it('blocks unauthenticated POST to admin categories gallery store', function () {
    $category = Category::query()->where('slug', 'graphic-design')->first();

    $this->post(route('admin.categories.gallery.store', $category), [
        'title' => 'Injected',
        'category' => 'Test',
        'image' => UploadedFile::fake()->image('work.webp'),
    ])->assertRedirect(route('admin.login'));

    $this->assertDatabaseMissing('category_portfolio_items', ['title' => 'Injected']);
});

// --- Permission gating ---

it('blocks a regular admin without the categories permission', function () {
    $admin = Admin::factory()->regular()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.categories.index'))
        ->assertForbidden();
});

it('allows a regular admin granted the categories permission', function () {
    $admin = Admin::factory()->withPermissions(['categories'])->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.categories.index'))
        ->assertSuccessful();
});

it('blocks a regular admin without the categories permission from the gallery routes', function () {
    $admin = Admin::factory()->regular()->create();
    $category = Category::query()->where('slug', 'graphic-design')->first();
    $item = $category->portfolioItems()->create([
        'title' => 'Guarded Item',
        'category' => 'Test',
        'alt' => 'Guarded Item',
        'image' => 'categories/guarded.jpg',
        'sort_order' => 0,
    ]);

    $this->actingAs($admin, 'admin')
        ->post(route('admin.categories.gallery.store', $category), [
            'title' => 'Injected',
            'category' => 'Test',
            'image' => UploadedFile::fake()->image('work.webp'),
        ])
        ->assertForbidden();

    $this->actingAs($admin, 'admin')
        ->delete(route('admin.categories.gallery.destroy', [$category, $item]))
        ->assertForbidden();

    $this->assertDatabaseMissing('category_portfolio_items', ['title' => 'Injected']);
    $this->assertDatabaseHas('category_portfolio_items', ['id' => $item->id]);
});
