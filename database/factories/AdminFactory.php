<?php

/**
 * Test data factory for the secondary Admin model.
 */

namespace Database\Factories;

use App\Leads\Enums\LeadRole;
use App\Models\Admin;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<Admin>
 */
class AdminFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            // Default to an omnipotent admin so the many existing tests
            // written before the permission system continue to exercise
            // every CMS section without needing explicit grants. Tests
            // that specifically exercise the permission system should
            // opt into a restricted admin via regular()/withPermissions().
            'is_super_admin' => true,
            'full_access' => true,
            'permissions' => [],
        ];
    }

    /**
     * A regular (non mother) admin with no section access by default.
     */
    public function regular(): static
    {
        return $this->state(fn () => [
            'is_super_admin' => false,
            'full_access' => false,
            'permissions' => [],
        ]);
    }

    /**
     * A regular admin granted full access to every CMS section.
     */
    public function fullAccess(): static
    {
        return $this->state(fn () => [
            'is_super_admin' => false,
            'full_access' => true,
            'permissions' => [],
        ]);
    }

    /**
     * A regular admin granted access only to the given section keys.
     *
     * @param  array<int, string>  $keys
     */
    public function withPermissions(array $keys): static
    {
        return $this->state(fn () => [
            'is_super_admin' => false,
            'full_access' => false,
            'permissions' => $keys,
        ]);
    }

    /**
     * Give this admin a Lead Management role. Chain after regular(),
     * fullAccess() or withPermissions(), since the default state is the
     * mother admin (who is always a lead Manager regardless).
     */
    public function withLeadRole(LeadRole $role): static
    {
        return $this->state(fn () => ['lead_role' => $role]);
    }

    /**
     * A regular admin whose only access is Lead Management as an Agent.
     */
    public function leadAgent(): static
    {
        return $this->regular()->withLeadRole(LeadRole::Agent);
    }

    /**
     * A regular admin whose only access is Lead Management as a Manager.
     */
    public function leadManager(): static
    {
        return $this->regular()->withLeadRole(LeadRole::Manager);
    }
}
