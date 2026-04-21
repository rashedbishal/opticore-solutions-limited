<?php

namespace Database\Factories;

use App\Models\PortfolioSubCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PortfolioSubCategory>
 */
class PortfolioSubCategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'category_slug' => fake()->randomElement([
                'graphic-design',
                '3d-production',
                'web-development',
                'digital-marketing',
                'video-editing',
            ]),
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'price' => fake()->randomElement(['500 BDT', '1500 BDT', 'Custom Quote']),
            'rating' => fake()->randomFloat(1, 4.0, 5.0),
            'reviews_count' => fake()->numberBetween(0, 500),
            'image' => fake()->imageUrl(800, 600),
            'sort_order' => fake()->numberBetween(0, 50),
        ];
    }
}
