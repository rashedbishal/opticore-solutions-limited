<?php

namespace Database\Factories;

use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Portfolio>
 */
class PortfolioFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'category' => fake()->randomElement([
                'graphic-design',
                '3d-production',
                'web-development',
                'digital-marketing',
                'video-editing',
            ]),
            'sub_category_id' => null,
            'media_path' => 'portfolios/test-'.uniqid().'.jpg',
            'media_type' => 'image',
            'alt' => fake()->sentence(3),
        ];
    }

    public function forSubCategory(PortfolioSubCategory $subCategory): static
    {
        return $this->state([
            'category' => $subCategory->category_slug,
            'sub_category_id' => $subCategory->id,
        ]);
    }
}
