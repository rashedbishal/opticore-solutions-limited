<?php

namespace Database\Seeders;

use App\Models\PortfolioSubCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PortfolioSubCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subCategories = [
            'graphic-design' => [
                'Logo & Branding',
                'Flyer & Brochure Design',
                'UI/UX Design',
                'Social Media Creatives',
            ],
            'digital-marketing' => [
                'Search Engine Optimization (SEO)',
                'Social Media Management',
                'Paid Ads (PPC)',
                'Content Marketing',
            ],
            'video-editing' => [
                'YouTube Video Editing',
                'Short Form (Reels/TikTok)',
                'Corporate & Promo Videos',
                'Music Videos',
            ],
            '3d-production' => [
                'Product Rendering',
                'Character Animation',
                'Architectural Visualization',
            ],
            'web-development' => [
                'E-commerce Stores',
                'Custom Web Applications',
                'Landing Pages',
                'Corporate Portfolios',
            ],
        ];

        $sortOrder = 1;

        foreach ($subCategories as $categorySlug => $names) {
            foreach ($names as $name) {
                PortfolioSubCategory::firstOrCreate(
                    ['slug' => Str::slug($name)],
                    [
                        'category_slug' => $categorySlug,
                        'name' => $name,
                        'description' => "Professional {$name} services crafted for your needs.",
                        'price' => '$250+',
                        'rating' => 4.9,
                        'reviews_count' => rand(15, 120),
                        'sort_order' => $sortOrder++,
                    ]
                );
            }
        }
    }
}
