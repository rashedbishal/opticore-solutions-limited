<?php

namespace Database\Seeders;

use App\Models\PortfolioSubCategory;
use Illuminate\Database\Seeder;

class PortfolioSubCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subCategories = [
            'graphic-design' => [
                [
                    'name' => 'Social Media Post',
                    'slug' => 'social-media-post-design',
                    'price' => '500 BDT',
                    'rating' => 4.9,
                    'reviews' => 128,
                    'image' => 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800',
                ],
                [
                    'name' => 'YouTube Thumbnail',
                    'slug' => 'youtube-thumbnail-design',
                    'price' => '300 BDT',
                    'rating' => 5.0,
                    'reviews' => 84,
                    'image' => 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=800',
                ],
                [
                    'name' => 'Brochure Design',
                    'slug' => 'brochure-design',
                    'price' => '1500 BDT',
                    'rating' => 4.8,
                    'reviews' => 42,
                    'image' => 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?q=80&w=800',
                ],
                [
                    'name' => 'Logo Identity',
                    'slug' => 'logo-identity-design',
                    'price' => '2500 BDT',
                    'rating' => 5.0,
                    'reviews' => 156,
                    'image' => 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800',
                ],
            ],
            'digital-marketing' => [
                [
                    'name' => 'Search Engine Optimization',
                    'slug' => 'seo-services',
                    'price' => '10000 BDT',
                    'rating' => 4.8,
                    'reviews' => 45,
                    'image' => 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=800',
                ],
                [
                    'name' => 'Social Media Management',
                    'slug' => 'social-media-management',
                    'price' => '15000 BDT',
                    'rating' => 4.9,
                    'reviews' => 78,
                    'image' => 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?q=80&w=800',
                ],
                [
                    'name' => 'Paid Ads (PPC)',
                    'slug' => 'paid-ads-ppc',
                    'price' => '12000 BDT',
                    'rating' => 4.7,
                    'reviews' => 60,
                    'image' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800',
                ],
            ],
            'video-editing' => [
                [
                    'name' => 'Reels & Shorts',
                    'slug' => 'reels-shorts-editing',
                    'price' => '800 BDT',
                    'rating' => 4.9,
                    'reviews' => 210,
                    'image' => 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800',
                ],
                [
                    'name' => 'YouTube Video',
                    'slug' => 'youtube-video-editing',
                    'price' => '2000 BDT',
                    'rating' => 4.7,
                    'reviews' => 95,
                    'image' => 'https://images.unsplash.com/photo-1622737133809-d95047b9e673?q=80&w=800',
                ],
            ],
            '3d-production' => [
                [
                    'name' => 'Product Render',
                    'slug' => 'product-rendering',
                    'price' => '3500 BDT',
                    'rating' => 5.0,
                    'reviews' => 34,
                    'image' => 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800',
                ],
                [
                    'name' => '3D Animation',
                    'slug' => '3d-animation',
                    'price' => '8000 BDT',
                    'rating' => 4.9,
                    'reviews' => 18,
                    'image' => 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?q=80&w=800',
                ],
            ],
            'web-development' => [
                [
                    'name' => 'Landing Page',
                    'slug' => 'landing-page-dev',
                    'price' => '5000 BDT',
                    'rating' => 4.9,
                    'reviews' => 67,
                    'image' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800',
                ],
                [
                    'name' => 'E-commerce Site',
                    'slug' => 'ecommerce-dev',
                    'price' => '15000 BDT',
                    'rating' => 5.0,
                    'reviews' => 29,
                    'image' => 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=800',
                ],
            ],
        ];

        $sortOrder = 1;

        foreach ($subCategories as $categorySlug => $items) {
            foreach ($items as $item) {
                PortfolioSubCategory::updateOrCreate(
                    ['slug' => $item['slug']],
                    [
                        'category_slug' => $categorySlug,
                        'name' => $item['name'],
                        'description' => "Professional {$item['name']} services crafted for your needs.",
                        'price' => $item['price'],
                        'rating' => $item['rating'],
                        'reviews_count' => $item['reviews'],
                        'image' => $item['image'],
                        'sort_order' => $sortOrder++,
                    ]
                );
            }
        }
    }
}
