<?php

namespace Database\Factories\Leads;

use App\Leads\Models\LeadStatus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<LeadStatus>
 */
class LeadStatusFactory extends Factory
{
    protected $model = LeadStatus::class;

    public function definition(): array
    {
        $name = Str::title(fake()->unique()->words(2, true));

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'color' => fake()->randomElement(LeadStatus::availableColors()),
            'is_closed' => false,
            'sort_order' => (int) LeadStatus::query()->max('sort_order') + 1,
        ];
    }
}
