<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PortfolioSubCategorySeeder extends Seeder
{
    public function run(): void
    {
        $subCategories = [
            // Graphic Design
            ['category_slug' => 'graphic-design', 'name' => 'Social Media Post', 'slug' => 'social-media-post', 'price' => '500 BDT', 'rating' => 4.9, 'reviews_count' => 128, 'sort_order' => 1],
            ['category_slug' => 'graphic-design', 'name' => 'YouTube Thumbnail', 'slug' => 'youtube-thumbnail', 'price' => '300 BDT', 'rating' => 5.0, 'reviews_count' => 84, 'sort_order' => 2],
            ['category_slug' => 'graphic-design', 'name' => 'Brochure Design', 'slug' => 'brochure-design', 'price' => '1500 BDT', 'rating' => 4.8, 'reviews_count' => 42, 'sort_order' => 3],
            ['category_slug' => 'graphic-design', 'name' => 'Logo Design', 'slug' => 'logo-design', 'price' => '2500 BDT', 'rating' => 5.0, 'reviews_count' => 156, 'sort_order' => 4],

            // 3D Production
            ['category_slug' => '3d-production', 'name' => '3D Modeling', 'slug' => '3d-modeling', 'price' => '2000 BDT', 'rating' => 4.8, 'reviews_count' => 55, 'sort_order' => 1],
            ['category_slug' => '3d-production', 'name' => 'Product Visualization', 'slug' => 'product-visualization', 'price' => '1000 BDT', 'rating' => 5.0, 'reviews_count' => 34, 'sort_order' => 2],
            ['category_slug' => '3d-production', 'name' => '3D Animation', 'slug' => '3d-animation', 'price' => '10000 BDT', 'rating' => 4.9, 'reviews_count' => 18, 'sort_order' => 3],

            // Web Development
            ['category_slug' => 'web-development', 'name' => 'Frontend Development', 'slug' => 'frontend-development', 'price' => '15000 BDT', 'rating' => 4.9, 'reviews_count' => 67, 'sort_order' => 1],
            ['category_slug' => 'web-development', 'name' => 'Backend Development', 'slug' => 'backend-development', 'price' => '20000 BDT', 'rating' => 4.7, 'reviews_count' => 45, 'sort_order' => 2],
            ['category_slug' => 'web-development', 'name' => 'Fullstack Development', 'slug' => 'fullstack-development', 'price' => '50000 BDT', 'rating' => 5.0, 'reviews_count' => 29, 'sort_order' => 3],
            ['category_slug' => 'web-development', 'name' => 'E-commerce Development', 'slug' => 'e-commerce-dev', 'price' => '25000 BDT', 'rating' => 5.0, 'reviews_count' => 30, 'sort_order' => 4],

            // Digital Marketing
            ['category_slug' => 'digital-marketing', 'name' => 'SEO Optimization', 'slug' => 'seo-optimization', 'price' => '8000 BDT', 'rating' => 4.8, 'reviews_count' => 72, 'sort_order' => 1],
            ['category_slug' => 'digital-marketing', 'name' => 'Content Marketing', 'slug' => 'content-marketing', 'price' => '12000 BDT', 'rating' => 4.9, 'reviews_count' => 58, 'sort_order' => 2],
            ['category_slug' => 'digital-marketing', 'name' => 'Social Media Management', 'slug' => 'social-media-management', 'price' => '10000 BDT', 'rating' => 4.7, 'reviews_count' => 99, 'sort_order' => 3],
            ['category_slug' => 'digital-marketing', 'name' => 'Paid Advertising (PPC)', 'slug' => 'paid-advertising', 'price' => 'Custom Quote', 'rating' => 4.9, 'reviews_count' => 61, 'sort_order' => 4],

            // Video Editing
            ['category_slug' => 'video-editing', 'name' => 'Promotional Videos', 'slug' => 'promotional-videos', 'price' => '15000 BDT', 'rating' => 4.8, 'reviews_count' => 52, 'sort_order' => 1],
            ['category_slug' => 'video-editing', 'name' => 'Social Media Videos', 'slug' => 'social-media-videos', 'price' => '8000 BDT', 'rating' => 4.9, 'reviews_count' => 115, 'sort_order' => 2],
            ['category_slug' => 'video-editing', 'name' => 'Explainer Videos', 'slug' => 'explainer-videos', 'price' => '25000 BDT', 'rating' => 4.7, 'reviews_count' => 39, 'sort_order' => 3],
            ['category_slug' => 'video-editing', 'name' => 'Corporate Videos', 'slug' => 'corporate-videos', 'price' => '35000 BDT', 'rating' => 4.8, 'reviews_count' => 22, 'sort_order' => 4],
        ];

        $now = now();

        foreach ($subCategories as $data) {
            DB::table('portfolio_sub_categories')->upsert(
                array_merge($data, ['created_at' => $now, 'updated_at' => $now]),
                ['slug'],
                ['name', 'category_slug', 'price', 'rating', 'reviews_count', 'sort_order', 'updated_at'],
            );
        }
    }
}
