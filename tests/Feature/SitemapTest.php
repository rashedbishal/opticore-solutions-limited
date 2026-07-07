<?php

use App\Models\Admin;
use App\Models\Blog;
use App\Models\Category;
use App\Models\PortfolioSubCategory;
use Illuminate\Support\Facades\Cache;

it('includes static pages, service/portfolio category pages, subcategory pages, and blog posts', function () {
    $subCategory = PortfolioSubCategory::factory()->create(['category_slug' => 'graphic-design']);
    $blog = Blog::factory()->create();

    $xml = $this->get(route('sitemap'))
        ->assertSuccessful()
        ->headers->get('Content-Type');

    expect($xml)->toContain('application/xml');

    $response = $this->get(route('sitemap'));
    $body = $response->getContent();

    expect($body)
        ->toContain('<loc>'.config('app.url').'/</loc>')
        ->toContain('<loc>'.config('app.url').'/graphic-design</loc>')
        ->toContain('<loc>'.config('app.url').'/portfolio/graphic-design</loc>')
        ->toContain("/portfolio/graphic-design/{$subCategory->slug}</loc>")
        ->toContain("/hire-us/graphic-design/{$subCategory->slug}</loc>")
        ->toContain("/blog/{$blog->slug}</loc>");
});

it('caches the sitemap for subsequent requests', function () {
    Cache::forget('sitemap.xml');

    $this->get(route('sitemap'))->assertSuccessful();

    expect(Cache::has('sitemap.xml'))->toBeTrue();
});

it('busts the sitemap cache when a category is updated', function () {
    Cache::put('sitemap.xml', '<cached/>', 60);

    $admin = Admin::factory()->create();
    $category = Category::query()->where('slug', 'graphic-design')->firstOrFail();

    $this->actingAs($admin, 'admin')
        ->put(route('admin.categories.update', $category), [
            'label' => $category->label,
            'description' => 'Updated description.',
        ])
        ->assertRedirect(route('admin.categories.index'));

    expect(Cache::has('sitemap.xml'))->toBeFalse();
});

it('busts the sitemap cache when a portfolio subcategory is created', function () {
    Cache::put('sitemap.xml', '<cached/>', 60);

    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->post(route('admin.sub-categories.store'), [
            'category_slug' => 'graphic-design',
            'name' => 'Cache Buster Subcategory',
            'slug' => '',
            'price' => '500 BDT',
        ]);

    expect(Cache::has('sitemap.xml'))->toBeFalse();
});

it('busts the sitemap cache when a blog post is stored', function () {
    Cache::put('sitemap.xml', '<cached/>', 60);

    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->post(route('admin.blogs.store'), [
            'title' => 'Sitemap Cache Buster Post',
            'category' => 'Graphic Design',
            'content' => 'Some content.',
        ]);

    expect(Cache::has('sitemap.xml'))->toBeFalse();
});
