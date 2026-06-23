<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\CategoryPortfolioItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CategoryPortfolioItem>
 */
class CategoryPortfolioItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'title' => fake()->words(3, true),
            'category' => fake()->word(),
            'description' => fake()->sentence(),
            'image' => fake()->imageUrl(800, 600),
            'alt' => fake()->words(3, true),
            'sort_order' => fake()->numberBetween(0, 50),
        ];
    }
}
