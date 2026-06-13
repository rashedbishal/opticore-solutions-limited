<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $label = Str::title(fake()->unique()->words(2, true));

        return [
            'slug' => Str::slug($label),
            'label' => $label,
            'description' => fake()->sentence(),
            'sort_order' => fake()->numberBetween(0, 50),
        ];
    }
}
