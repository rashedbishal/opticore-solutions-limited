<?php

namespace Database\Seeders;

use App\Models\JobListing;
use Illuminate\Database\Seeder;

class CareerContentSeeder extends Seeder
{
    /**
     * Seed the career page's job listings with their existing copy so the
     * public page keeps showing the same content now that section is
     * CMS-managed.
     */
    public function run(): void
    {
        $jobs = [
            [
                'title' => 'Graphic Designer',
                'description' => 'Build premium brand systems, campaign visuals, and polished presentation assets for fast-moving client work.',
            ],
            [
                'title' => 'Video Editor',
                'description' => 'Edit social, branded, and long-form content with a strong sense of rhythm, storytelling, and motion detail.',
            ],
            [
                'title' => 'Web Developer',
                'description' => 'Ship high-quality digital experiences with strong frontend craft and dependable backend execution.',
            ],
            [
                'title' => 'Digital Marketer',
                'description' => 'Own campaign strategy, channel growth, and performance-minded systems across search, social, and lifecycle marketing.',
            ],
            [
                'title' => '3D Artist',
                'description' => 'Create high-end models, renders, and motion sequences for brand, product, and architectural work.',
            ],
        ];

        foreach ($jobs as $index => $job) {
            JobListing::query()->firstOrCreate(
                ['title' => $job['title']],
                [
                    'location' => 'Remote',
                    'type' => 'Full Time',
                    'description' => $job['description'],
                    'sort_order' => $index,
                    'is_active' => true,
                ],
            );
        }
    }
}
