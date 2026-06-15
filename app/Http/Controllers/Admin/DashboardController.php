<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\JobApplication;
use App\Models\Portfolio;
use App\Models\Task;
use App\Models\Transaction;
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
            'transactions' => [
                'monthly' => $this->monthlyTransactionTotals(),
            ],
        ]);
    }

    /**
     * Revenue and transaction counts for each of the last 12 months, based
     * on successful (Processing or Complete) transactions and bucketed by
     * the month a transaction was created.
     *
     * @return array<int, array{month: string, revenue: float, count: int}>
     */
    private function monthlyTransactionTotals(): array
    {
        $transactions = Transaction::query()
            ->select(['amount', 'created_at'])
            ->whereIn('status', ['Processing', 'Complete'])
            ->where('created_at', '>=', now()->subMonths(11)->startOfMonth())
            ->get();

        return array_map(function (array $month) use ($transactions): array {
            $inMonth = $transactions->filter(
                fn (Transaction $transaction): bool => $transaction->created_at->format('Y-m') === $month['key']
            );

            return [
                'month' => $month['label'],
                'revenue' => (float) $inMonth->sum('amount'),
                'count' => $inMonth->count(),
            ];
        }, $this->lastTwelveMonths());
    }

    /**
     * The last 12 months, oldest first, each with a "Y-m" lookup key and a
     * short display label.
     *
     * @return array<int, array{key: string, label: string}>
     */
    private function lastTwelveMonths(): array
    {
        return array_map(
            fn (int $monthsAgo): array => [
                'key' => now()->subMonths($monthsAgo)->format('Y-m'),
                'label' => now()->subMonths($monthsAgo)->format('M Y'),
            ],
            range(11, 0)
        );
    }
}
