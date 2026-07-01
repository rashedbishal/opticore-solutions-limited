<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\Category;
use App\Models\PortfolioSubCategory;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $xml = Cache::remember('sitemap.xml', now()->addMinutes(60), fn () => $this->build());

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=utf-8']);
    }

    private function build(): string
    {
        $base = rtrim(config('app.url'), '/');
        $categories = Category::configShape();
        $categorySlugs = array_keys($categories);

        $urls = [];

        // ── Static pages ──────────────────────────────────────────────────
        foreach ($this->staticPages() as [$path, $changefreq, $priority]) {
            $urls[] = $this->url($base.$path, $changefreq, $priority);
        }

        // ── Service pages  /{slug} ────────────────────────────────────────
        foreach ($categorySlugs as $slug) {
            $urls[] = $this->url("{$base}/{$slug}", 'monthly', '0.9');
        }

        // ── Portfolio category pages ──────────────────────────────────────
        foreach ($categorySlugs as $slug) {
            $urls[] = $this->url("{$base}/portfolio/{$slug}", 'weekly', '0.7');
        }

        // ── Portfolio & Hire-Us subcategory pages ─────────────────────────
        $subCategories = PortfolioSubCategory::query()
            ->whereIn('category_slug', $categorySlugs)
            ->orderBy('category_slug')
            ->orderBy('sort_order')
            ->get(['category_slug', 'slug']);

        foreach ($subCategories as $sc) {
            $urls[] = $this->url("{$base}/portfolio/{$sc->category_slug}/{$sc->slug}", 'weekly', '0.6');
            $urls[] = $this->url("{$base}/hire-us/{$sc->category_slug}/{$sc->slug}", 'weekly', '0.7');
        }

        // ── Blog posts ────────────────────────────────────────────────────
        $blogs = Blog::latest()->get(['slug', 'updated_at']);
        foreach ($blogs as $blog) {
            $urls[] = $this->url("{$base}/blog/{$blog->slug}", 'monthly', '0.6', $blog->updated_at->toDateString());
        }

        return '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n"
            .implode('', $urls)
            .'</urlset>'."\n";
    }

    /** @return array<array{string, string, string}> */
    private function staticPages(): array
    {
        return [
            ['/',                'weekly',  '1.0'],
            ['/hire-us',         'weekly',  '0.9'],
            ['/portfolio',       'weekly',  '0.8'],
            ['/blogs',           'daily',   '0.8'],
            ['/about-us',        'monthly', '0.7'],
            ['/career',          'monthly', '0.7'],
            ['/contact',         'monthly', '0.7'],
            ['/faq',             'monthly', '0.5'],
            ['/message-from-md', 'monthly', '0.4'],
            ['/privacy-policy',  'monthly', '0.3'],
            ['/terms-conditions', 'monthly', '0.3'],
        ];
    }

    private function url(string $loc, string $changefreq, string $priority, ?string $lastmod = null): string
    {
        $lastmodTag = $lastmod ? "    <lastmod>{$lastmod}</lastmod>\n" : '';

        return "  <url>\n"
            .'    <loc>'.htmlspecialchars($loc, ENT_XML1)."</loc>\n"
            .$lastmodTag
            ."    <changefreq>{$changefreq}</changefreq>\n"
            ."    <priority>{$priority}</priority>\n"
            ."  </url>\n";
    }
}
