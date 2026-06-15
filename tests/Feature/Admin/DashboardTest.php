<?php

use App\Models\Admin;
use App\Models\Blog;
use App\Models\JobApplication;
use App\Models\Portfolio;
use App\Models\Task;
use App\Models\Transaction;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the dashboard with stats, workflow, and transaction data', function () {
    $admin = Admin::factory()->create();

    Portfolio::factory()->count(2)->create();
    Blog::factory()->count(3)->create();
    JobApplication::factory()->create();

    Task::factory()->create(['state' => 'pending']);
    Task::factory()->create(['state' => 'pending']);
    Task::factory()->create(['state' => 'in progress']);
    Task::factory()->create(['state' => 'delivered']);

    Transaction::create([
        'name' => 'Customer One',
        'email' => 'one@example.com',
        'transaction_id' => 'dash-txn-1',
        'status' => 'Processing',
        'amount' => 100,
    ]);

    Transaction::create([
        'name' => 'Customer Two',
        'email' => 'two@example.com',
        'transaction_id' => 'dash-txn-2',
        'status' => 'Complete',
        'amount' => 250,
    ]);

    Transaction::create([
        'name' => 'Customer Three',
        'email' => 'three@example.com',
        'transaction_id' => 'dash-txn-3',
        'status' => 'Failed',
        'amount' => 500,
    ]);

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
            ->has('transactions.monthly', 12)
            ->where('transactions.monthly.11.revenue', 350)
            ->where('transactions.monthly.11.count', 2)
        );
});

it('blocks guests from the dashboard', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('admin.login'));
});
