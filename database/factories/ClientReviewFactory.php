<?php

namespace Database\Factories;

use App\Models\ClientReview;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClientReview>
 */
class ClientReviewFactory extends Factory
{
    public function definition(): array
    {
        $task = Task::factory()->create();

        return [
            'task_id' => $task->id,
            'user_id' => $task->user_id,
            'sub_category_id' => $task->sub_category_id,
            'category_slug' => $task->category,
            'username' => fake()->name(),
            'client_type' => fake()->randomElement(['new', 'repeat']),
            'rating' => fake()->numberBetween(1, 5),
            'comment' => fake()->paragraph(),
            'sort_order' => 0,
        ];
    }
}
