<?php

namespace Database\Factories\Leads;

use App\Leads\Enums\LeadPriority;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadStatus;
use App\Models\Admin;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        return [
            'source_id' => fn () => LeadSource::ofType(LeadSourceType::Manual)->id,
            'status_id' => fn () => LeadStatus::initial()?->id,
            'priority' => LeadPriority::Medium,
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '+8801'.fake()->numerify('#########'),
        ];
    }

    public function assignedTo(Admin $admin): static
    {
        return $this->state(fn () => ['assigned_to' => $admin->id, 'assigned_at' => now()]);
    }

    public function fromSource(LeadSource $source): static
    {
        return $this->state(fn () => ['source_id' => $source->id]);
    }
}
