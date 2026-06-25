<?php

namespace Database\Factories;

use App\Models\Blog;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Blog>
 */
class BlogFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->sentence(5);

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.uniqid(),
            'category' => fake()->randomElement([
                'Graphic Design',
                'Digital Marketing',
                'Video Editing',
                '3D Production',
                'Web Development',
            ]),
            'excerpt' => fake()->sentence(12),
            'content' => fake()->paragraphs(4, true),
            'author' => fake()->name(),
            'read_time' => fake()->numberBetween(1, 15).' min read',
            'image' => null,
        ];
    }
}
