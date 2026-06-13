<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'slug' => 'graphic-design',
                'label' => 'Graphic Design',
                'description' => 'Premium visual communication, typography, and identities crafted for modern brands.',
            ],
            [
                'slug' => 'digital-marketing',
                'label' => 'Digital Marketing',
                'description' => 'Data-driven campaigns, social strategies, and high-conversion assets designed to scale.',
            ],
            [
                'slug' => 'video-editing',
                'label' => 'Video Editing',
                'description' => 'Seamless transitions, cinematic color grading, and dynamic cuts for ultimate engagement.',
            ],
            [
                'slug' => '3d-production',
                'label' => '3D Production',
                'description' => 'Hyper-realistic simulations, architectural renders, and immersive 3D motion graphics.',
            ],
            [
                'slug' => 'web-development',
                'label' => 'Web Development',
                'description' => 'Performant, scalable, and responsive digital platforms engineered for exceptional UX.',
            ],
        ];

        foreach ($categories as $index => $category) {
            Category::query()->updateOrCreate(
                ['slug' => $category['slug']],
                [
                    'label' => $category['label'],
                    'description' => $category['description'],
                    'sort_order' => $index,
                ]
            );
        }
    }
}
