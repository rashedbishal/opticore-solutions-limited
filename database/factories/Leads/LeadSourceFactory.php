<?php

namespace Database\Factories\Leads;

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeadSource>
 */
class LeadSourceFactory extends Factory
{
    protected $model = LeadSource::class;

    public function definition(): array
    {
        return [
            'type' => LeadSourceType::Manual,
            'name' => fake()->words(2, true),
            'is_active' => true,
        ];
    }
}
