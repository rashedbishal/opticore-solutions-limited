<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Blog;
use App\Models\JobApplication;
use App\Models\Portfolio;
use App\Models\Task;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response|RedirectResponse
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();

        // An admin whose only granted section is meal-management never sees
        // the dashboard — every /admin visit (including the post-login and
        // redirect()->intended('/admin') funnels) lands here first, so this
        // is the single choke point for that redirect.
        if ($admin->isMealManagementOnly()) {
            return redirect()->route('admin.meal-management.index');
        }

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'portfolios' => Cache::rememberForever(
                    Portfolio::dashboardCountCacheKey(),
                    fn () => Portfolio::count(),
                ),
                'blogs' => Cache::rememberForever(
                    Blog::dashboardCountCacheKey(),
                    fn () => Blog::count(),
                ),
                'job_applications' => Cache::rememberForever(
                    JobApplication::dashboardCountCacheKey(),
                    fn () => JobApplication::count(),
                ),
                'monthlyPaymentReceived' => Cache::rememberForever(
                    Transaction::monthlyPaymentCacheKey(),
                    fn () => (float) Transaction::where('status', 'Processing')
                        ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
                        ->sum('store_amount'),
                ),
                'monthlyPaymentReceivedHref' => route('admin.transactions.index', [
                    'status' => 'Processing',
                    'date_from' => now()->startOfMonth()->toDateString(),
                    'date_to' => now()->endOfMonth()->toDateString(),
                ]),
            ],
            'workflow' => Cache::rememberForever(
                Task::workflowStatsCacheKey(),
                fn () => [
                    'pending' => Task::where('state', 'pending')->count(),
                    'processing' => Task::where('state', 'in progress')->count(),
                    'deliveredThisMonth' => Task::query()
                        ->where('state', 'delivered')
                        ->whereBetween('updated_at', [now()->startOfMonth(), now()->endOfMonth()])
                        ->count(),
                ],
            ),
        ]);
    }
}
