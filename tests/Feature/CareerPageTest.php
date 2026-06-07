<?php

use App\Models\JobListing;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the career page with only active job listings in sort order', function () {
    JobListing::factory()->create(['title' => 'Hidden Role', 'is_active' => false, 'sort_order' => 0]);
    JobListing::factory()->create(['title' => 'Second Role', 'is_active' => true, 'sort_order' => 2]);
    JobListing::factory()->create(['title' => 'First Role', 'is_active' => true, 'sort_order' => 1]);

    $this->get(route('career'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Career')
            ->where('jobListings.0.title', 'First Role')
            ->where('jobListings.1.title', 'Second Role')
            ->where('jobListings', fn ($jobs) => collect($jobs)->pluck('title')->doesntContain('Hidden Role'))
        );
});
