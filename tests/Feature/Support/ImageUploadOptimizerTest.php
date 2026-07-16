<?php

use App\Support\ImageUploadOptimizer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;

it('resizes an oversized upload and converts it to webp', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('big.jpg', 3000, 2000);

    $path = ImageUploadOptimizer::store($file, 'testimonials', 300);

    expect($path)->toEndWith('.webp');
    Storage::disk('public')->assertExists($path);
    expect(Storage::disk('public')->size($path))->toBeLessThan(50 * 1024);

    $image = ImageManager::gd()->read(Storage::disk('public')->path($path));
    expect(max($image->width(), $image->height()))->toBeLessThanOrEqual(300);
});

it('never upscales an image smaller than the target dimension', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('small.jpg', 100, 80);

    $path = ImageUploadOptimizer::store($file, 'testimonials', 300);

    $image = ImageManager::gd()->read(Storage::disk('public')->path($path));
    expect($image->width())->toBe(100)->and($image->height())->toBe(80);
});

it('passes svg uploads through untouched', function () {
    Storage::fake('public');

    $svg = UploadedFile::fake()->createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    $path = ImageUploadOptimizer::store($svg, 'brands', 400);

    expect($path)->toEndWith('.svg');
    Storage::disk('public')->assertExists($path);
});

it('passes gif uploads through untouched to preserve animation', function () {
    Storage::fake('public');

    $gif = UploadedFile::fake()->image('anim.gif', 500, 500);

    $path = ImageUploadOptimizer::store($gif, 'testimonials', 300);

    expect($path)->toEndWith('.gif');
});
