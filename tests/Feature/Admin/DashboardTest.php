<?php

use App\Models\Admin;
use App\Models\Blog;
use App\Models\JobApplication;
use App\Models\Portfolio;
use App\Models\Task;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the dashboard with stats and workflow data', function () {
    $admin = Admin::factory()->create();

    Portfolio::factory()->count(2)->create();
    Blog::factory()->count(3)->create();
    JobApplication::factory()->create();

    Task::factory()->create(['state' => 'pending']);
    Task::factory()->create(['state' => 'pending']);
    Task::factory()->create(['state' => 'in progress']);
    Task::factory()->create(['state' => 'delivered']);

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.portfolios', 2)
            ->where('stats.blogs', 3)
            ->where('stats.job_applications', 1)
            ->where('workflow.pending', 2)
            ->where('workflow.processing', 1)
            ->where('workflow.deliveredThisMonth', 1)
        );
});

it('blocks guests from the dashboard', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('admin.login'));
});
