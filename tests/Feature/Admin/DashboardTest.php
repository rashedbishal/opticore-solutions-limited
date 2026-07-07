<?php

use App\Models\Admin;
use App\Models\Blog;
use App\Models\JobApplication;
use App\Models\Portfolio;
use App\Models\Task;
use App\Models\Transaction;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

function createDashboardTransaction(array $attributes = []): Transaction
{
    return Transaction::create(array_merge([
        'name' => 'Dashboard Customer',
        'email' => 'dashboard-customer@example.com',
        'amount' => 100,
        'status' => 'Processing',
        'transaction_id' => 'txn-'.uniqid(),
    ], $attributes));
}

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

it('sums this month\'s Processing store_amount for the monthly payment card, excluding other statuses and months', function () {
    $admin = Admin::factory()->create();

    createDashboardTransaction(['transaction_id' => 'this-month-processing', 'store_amount' => 500]);
    createDashboardTransaction(['transaction_id' => 'this-month-pending', 'status' => 'Pending', 'store_amount' => 999]);

    createDashboardTransaction(['transaction_id' => 'last-month-processing', 'store_amount' => 777])
        ->forceFill(['created_at' => now()->subMonthNoOverflow()])
        ->save();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.monthlyPaymentReceived', 500)
        );
});

it('links the monthly payment card to Processing transactions filtered to the current month', function () {
    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.monthlyPaymentReceivedHref', route('admin.transactions.index', [
                'status' => 'Processing',
                'date_from' => now()->startOfMonth()->toDateString(),
                'date_to' => now()->endOfMonth()->toDateString(),
            ]))
        );
});

it('caches the monthly payment total and busts it on transaction create, update, and delete', function () {
    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('stats.monthlyPaymentReceived', 0));

    $transaction = createDashboardTransaction([
        'transaction_id' => 'cache-buster',
        'status' => 'Pending',
        'store_amount' => null,
    ]);

    $transaction->update(['status' => 'Processing', 'store_amount' => 250]);

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('stats.monthlyPaymentReceived', 250));

    $transaction->delete();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('stats.monthlyPaymentReceived', 0));
});

it('caches the portfolio, blog, and job application counts and busts them on create and delete', function () {
    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.portfolios', 0)
            ->where('stats.blogs', 0)
            ->where('stats.job_applications', 0)
        );

    $portfolio = Portfolio::factory()->create();
    Blog::factory()->create();
    JobApplication::factory()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.portfolios', 1)
            ->where('stats.blogs', 1)
            ->where('stats.job_applications', 1)
        );

    $portfolio->delete();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('stats.portfolios', 0));
});

it('caches the workflow stats and busts them on task create, update, and delete', function () {
    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('workflow.pending', 0)
            ->where('workflow.processing', 0)
            ->where('workflow.deliveredThisMonth', 0)
        );

    $task = Task::factory()->create(['state' => 'pending']);

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('workflow.pending', 1));

    $task->update(['state' => 'delivered']);

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('workflow.pending', 0)
            ->where('workflow.deliveredThisMonth', 1)
        );

    $task->delete();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('workflow.deliveredThisMonth', 0));
});

it('rolls over to a fresh cache key at the start of a new month with no scheduled reset job needed', function () {
    Cache::put(Transaction::monthlyPaymentCacheKey(), 999999.0);

    expect(Transaction::monthlyPaymentCacheKey())->toContain(now()->format('Y-m'));

    $this->travelTo(now()->addMonthNoOverflow()->startOfMonth());

    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('stats.monthlyPaymentReceived', 0));
});
