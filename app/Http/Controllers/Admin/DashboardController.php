<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\JobApplication;
use App\Models\Portfolio;
use App\Models\Task;
use App\Models\Transaction;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'portfolios' => Portfolio::count(),
                'blogs' => Blog::count(),
                'job_applications' => JobApplication::count(),
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
            'workflow' => [
                'pending' => Task::where('state', 'pending')->count(),
                'processing' => Task::where('state', 'in progress')->count(),
                'deliveredThisMonth' => Task::query()
                    ->where('state', 'delivered')
                    ->whereBetween('updated_at', [now()->startOfMonth(), now()->endOfMonth()])
                    ->count(),
            ],
        ]);
    }
}
