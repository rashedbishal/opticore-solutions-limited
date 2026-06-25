<?php

use App\Models\Admin;
use App\Models\Blog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

// --- Index ---
it('renders the blog index page for admins', function () {
    Blog::factory()->count(3)->create();

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.blogs.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Blog/Index')
            ->has('blogs')
        );
});

// --- Create ---
it('renders the blog create page', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.blogs.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Blog/Create'));
});

// --- Store ---
it('stores a new blog post and redirects to index', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.blogs.store'), [
            'title' => 'How to Build a Brand',
            'category' => 'Graphic Design',
            'content' => 'This is the full blog content.',
            'excerpt' => 'A short excerpt.',
            'author' => 'Rashed',
            'read_time' => '5 min read',
        ])
        ->assertRedirect(route('admin.blogs.index'));

    $this->assertDatabaseHas('blogs', ['title' => 'How to Build a Brand']);
});

it('auto-generates a unique slug on store', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.blogs.store'), [
            'title' => 'My Blog Post',
            'category' => 'Digital Marketing',
            'content' => 'Content here.',
        ]);

    $blog = Blog::where('title', 'My Blog Post')->first();
    expect($blog)->not->toBeNull();
    expect($blog->slug)->toStartWith('my-blog-post');
});

it('stores a blog post with an uploaded image', function () {
    Storage::fake('public');

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.blogs.store'), [
            'title' => 'Blog With Image',
            'category' => 'Web Development',
            'content' => 'Content here.',
            'image' => UploadedFile::fake()->image('cover.jpg', 800, 400),
        ]);

    $blog = Blog::where('title', 'Blog With Image')->first();
    expect($blog)->not->toBeNull();
    expect($blog->image)->not->toBeNull();

    // Strip /storage/ prefix to get the disk-relative path
    $diskPath = ltrim(str_replace('/storage/', '', $blog->image), '/');
    Storage::disk('public')->assertExists($diskPath);
});

it('clears the blog index cache when storing a new post', function () {
    Cache::put('blog.index', 'cached', 60);

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.blogs.store'), [
            'title' => 'Cache Buster Post',
            'category' => 'Graphic Design',
            'content' => 'Some content.',
        ]);

    expect(Cache::has('blog.index'))->toBeFalse();
});

it('validates required fields when storing a blog', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.blogs.store'), [])
        ->assertInvalid(['title', 'content']);
});

it('validates category is required when storing a blog', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.blogs.store'), [
            'title' => 'Title Only',
            'content' => 'Content here.',
        ])
        ->assertInvalid(['category']);
});

it('rejects a category that is not in the Categories CMS', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.blogs.store'), [
            'title' => 'Title Only',
            'category' => 'Not A Real Category',
            'content' => 'Content here.',
        ])
        ->assertInvalid(['category']);
});

it('rejects a blog image exceeding 10 MB', function () {
    Storage::fake('public');

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.blogs.store'), [
            'title' => 'Huge Image Blog',
            'category' => 'Graphic Design',
            'content' => 'Content.',
            'image' => UploadedFile::fake()->create('huge.jpg', 11_000, 'image/jpeg'),
        ])
        ->assertInvalid(['image']);
});

// --- Edit ---
it('renders the blog edit page with the blog data', function () {
    $blog = Blog::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.blogs.edit', $blog))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Blog/Edit')
            ->where('blog.id', $blog->id)
            ->where('blog.title', $blog->title)
        );
});

// --- Update ---
it('updates a blog post and redirects to index', function () {
    $blog = Blog::factory()->create(['title' => 'Old Title']);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.blogs.update', $blog), [
            'title' => 'New Title',
            'category' => 'Graphic Design',
            'content' => 'Updated content.',
        ])
        ->assertRedirect(route('admin.blogs.index'));

    $this->assertDatabaseHas('blogs', [
        'id' => $blog->id,
        'title' => 'New Title',
    ]);
});

it('replaces the blog image when a new one is uploaded', function () {
    Storage::fake('public');

    $oldFile = UploadedFile::fake()->image('old.jpg');
    $oldPath = $oldFile->store('blogs', 'public');
    $blog = Blog::factory()->create(['image' => Storage::url($oldPath)]);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.blogs.update', $blog), [
            'title' => $blog->title,
            'category' => $blog->category,
            'content' => 'Updated content.',
            'image' => UploadedFile::fake()->image('new.jpg'),
        ]);

    Storage::disk('public')->assertMissing($oldPath);
    $blog->refresh();
    expect($blog->image)->not->toContain('old.jpg');
});

it('clears slug and post caches when updating a blog', function () {
    $blog = Blog::factory()->create();
    Cache::put('blog.index', 'data', 60);
    Cache::put("blog.show.{$blog->slug}", 'data', 60);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.blogs.update', $blog), [
            'title' => 'Updated',
            'category' => 'Graphic Design',
            'content' => 'Content.',
        ]);

    expect(Cache::has('blog.index'))->toBeFalse()
        ->and(Cache::has("blog.show.{$blog->slug}"))->toBeFalse();
});

// --- Destroy ---
it('deletes a blog post and redirects back', function () {
    $blog = Blog::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.blogs.destroy', $blog))
        ->assertRedirect();

    $this->assertDatabaseMissing('blogs', ['id' => $blog->id]);
});

it('deletes the associated image file when a blog is deleted', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('post.jpg');
    $path = $file->store('blogs', 'public');
    $blog = Blog::factory()->create(['image' => Storage::url($path)]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.blogs.destroy', $blog));

    Storage::disk('public')->assertMissing($path);
    $this->assertDatabaseMissing('blogs', ['id' => $blog->id]);
});
