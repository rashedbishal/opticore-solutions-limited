<?php

namespace Database\Factories;

use App\Models\PortfolioSubCategory;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $category = fake()->randomElement(['graphic-design', 'digital-marketing', 'video-editing', '3d-production', 'web-development']);

        return [
            'client_name' => fake()->name(),
            'user_id' => User::factory(),
            'category' => $category,
            'sub_category_id' => PortfolioSubCategory::factory(),
            'task_name' => fake()->sentence(3),
            'date' => fake()->date(),
            'state' => fake()->randomElement(['pending', 'in progress', 'delivered']),
        ];
    }
}
