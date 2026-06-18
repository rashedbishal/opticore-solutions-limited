<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\JobApplication;
use App\Models\Portfolio;
use App\Models\Task;
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
