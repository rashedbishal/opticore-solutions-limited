<?php

use App\Models\Admin;
use App\Models\JobListing;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

it('lists job listings on the admin index page', function () {
    JobListing::factory()->create(['title' => 'Web Developer', 'sort_order' => 1]);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.job-listings.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/JobListing/Index')
            ->where('jobListings.data.0.title', 'Web Developer')
        );
});

it('renders the create job listing page', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.job-listings.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/JobListing/Create'));
});

it('creates a job listing and clears the public career cache', function () {
    Cache::put('career.jobListings', [['title' => 'Stale']], now()->addMinutes(60));

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.job-listings.store'), [
            'title' => 'Graphic Designer',
            'location' => 'Remote',
            'type' => 'Full Time',
            'description' => 'Build premium brand systems and campaign visuals.',
            'sort_order' => 2,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.job-listings.index'));

    $this->assertDatabaseHas('job_listings', [
        'title' => 'Graphic Designer',
        'sort_order' => 2,
        'is_active' => true,
    ]);
    expect(Cache::get('career.jobListings'))->toBeNull();
});

it('rejects job listing creation with missing required fields', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.job-listings.store'), [])
        ->assertInvalid(['title', 'location', 'type', 'description']);
});

it('renders the edit job listing page with existing data', function () {
    $jobListing = JobListing::factory()->create(['title' => 'Can this be edited?']);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.job-listings.edit', $jobListing))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/JobListing/Edit')
            ->where('jobListing.title', 'Can this be edited?')
        );
});

it('updates a job listing and clears the public career cache', function () {
    $jobListing = JobListing::factory()->create(['is_active' => true]);
    Cache::put('career.jobListings', [['title' => 'Stale']], now()->addMinutes(60));

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.job-listings.update', $jobListing), [
            'title' => 'Updated Title',
            'location' => 'Hybrid',
            'type' => 'Part Time',
            'description' => 'Updated description.',
            'sort_order' => 5,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.job-listings.index'));

    $jobListing->refresh();

    expect($jobListing->title)->toBe('Updated Title');
    expect($jobListing->sort_order)->toBe(5);
    expect($jobListing->is_active)->toBeFalse();
    expect(Cache::get('career.jobListings'))->toBeNull();
});

it('deletes a job listing and clears the public career cache', function () {
    $jobListing = JobListing::factory()->create();
    Cache::put('career.jobListings', [['title' => 'Stale']], now()->addMinutes(60));

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.job-listings.destroy', $jobListing))
        ->assertRedirect();

    $this->assertDatabaseMissing('job_listings', ['id' => $jobListing->id]);
    expect(Cache::get('career.jobListings'))->toBeNull();
});
