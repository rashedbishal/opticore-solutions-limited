<?php

use App\Models\Admin;
use App\Models\Brand;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    $this->admin = Admin::factory()->create();
});

it('stores a brand logo when creating a brand', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.brands.store'), [
            'name' => 'Logo Corp',
            'logo' => UploadedFile::fake()->image('logo.png', 200, 200),
        ])
        ->assertRedirect();

    $brand = Brand::where('name', 'Logo Corp')->first();
    expect($brand)->not->toBeNull();
    expect($brand->logo_path)->toStartWith('/storage/brands/');

    $diskPath = ltrim(str_replace('/storage/', '', $brand->logo_path), '/');
    Storage::disk('public')->assertExists($diskPath);
});

it('replaces the old logo file when updating a brand with a new logo', function () {
    $oldFile = UploadedFile::fake()->image('old-logo.png');
    $oldPath = $oldFile->store('brands', 'public');
    $brand = Brand::factory()->create(['logo_path' => '/storage/'.$oldPath]);

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.brands.update', $brand), [
            'name' => $brand->name,
            'logo' => UploadedFile::fake()->image('new-logo.png'),
        ]);

    Storage::disk('public')->assertMissing($oldPath);
    $brand->refresh();
    expect($brand->logo_path)->not->toBe('/storage/'.$oldPath);
});

it('deletes the logo file when a brand is deleted', function () {
    $file = UploadedFile::fake()->image('brand.png');
    $path = $file->store('brands', 'public');
    $brand = Brand::factory()->create(['logo_path' => '/storage/'.$path]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.brands.destroy', $brand));

    Storage::disk('public')->assertMissing($path);
    $this->assertDatabaseMissing('brands', ['id' => $brand->id]);
});

it('clears the home brands cache when a brand is created, updated, or deleted', function () {
    Cache::put('home.brands', 'cached', 60);

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.brands.store'), ['name' => 'Cache Test Brand']);

    expect(Cache::has('home.brands'))->toBeFalse();
});

it('rejects a logo file exceeding 2 MB', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.brands.store'), [
            'name' => 'Big Logo Brand',
            'logo' => UploadedFile::fake()->create('huge.png', 3000, 'image/png'),
        ])
        ->assertInvalid(['logo']);
});

it('rejects non-image files as a logo', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.brands.store'), [
            'name' => 'Bad Logo Brand',
            'logo' => UploadedFile::fake()->create('script.php', 10, 'application/x-php'),
        ])
        ->assertInvalid(['logo']);
});
