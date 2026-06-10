<?php

namespace App\Http\Controllers\Admin;

use App\Events\OrderUpdated;
use App\Events\TransactionUpdated;
use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\PortfolioSubCategory;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = DB::table('orders')
            ->leftJoin('portfolio_sub_categories', 'orders.subcategory_id', '=', 'portfolio_sub_categories.id')
            ->select('orders.*', 'portfolio_sub_categories.name as subcategory_name')
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->where('orders.status', $request->input('status'));
            })
            ->when($request->filled('date_from'), function ($query) use ($request) {
                $query->whereDate('orders.created_at', '>=', $request->input('date_from'));
            })
            ->when($request->filled('date_to'), function ($query) use ($request) {
                $query->whereDate('orders.created_at', '<=', $request->input('date_to'));
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->input('search');
                $query->where(function ($query) use ($search) {
                    $query->where('orders.name', 'like', "%{$search}%")
                        ->orWhere('orders.email', 'like', "%{$search}%")
                        ->orWhere('orders.transaction_id', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('customer'), function ($query) use ($request) {
                $term = $request->input('customer');
                $query->where(function ($query) use ($term) {
                    $query->where('orders.name', 'like', "%{$term}%")
                        ->orWhere('orders.email', 'like', "%{$term}%")
                        ->orWhere('orders.phone', 'like', "%{$term}%");
                });
            })
            ->when($request->filled('transaction_id'), function ($query) use ($request) {
                $query->where('orders.transaction_id', 'like', '%'.$request->input('transaction_id').'%');
            })
            ->when($request->filled('category'), function ($query) use ($request) {
                $query->where('orders.category', $request->input('category'));
            })
            ->when($request->filled('subcategory_id'), function ($query) use ($request) {
                $query->where('orders.subcategory_id', $request->input('subcategory_id'));
            })
            ->when($request->filled('amount_min') && is_numeric($request->input('amount_min')), function ($query) use ($request) {
                $query->where('orders.amount', '>=', $request->input('amount_min'));
            })
            ->when($request->filled('amount_max') && is_numeric($request->input('amount_max')), function ($query) use ($request) {
                $query->where('orders.amount', '<=', $request->input('amount_max'));
            })
            ->orderByDesc('orders.id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Order/Index', [
            'orders' => $orders,
            'filters' => $request->only([
                'status', 'date_from', 'date_to', 'search',
                'customer', 'transaction_id', 'category', 'subcategory_id', 'amount_min', 'amount_max',
            ]),
            'filterOptions' => [
                'categories' => collect(config('portfolio.categories'))
                    ->map(fn ($category, $slug) => ['slug' => $slug, 'label' => $category['label']])
                    ->values(),
                'subcategories' => PortfolioSubCategory::query()
                    ->select('id', 'name', 'category_slug')
                    ->orderBy('category_slug')
                    ->orderBy('sort_order')
                    ->get(),
            ],
        ]);
    }

    public function erase(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:Pending,Failed'],
            'password' => ['required', 'string'],
        ]);

        $motherAdmin = Admin::motherAdmin();

        if (! $motherAdmin || ! Hash::check($validated['password'], $motherAdmin->password)) {
            return back()->withErrors(['password' => 'The password you entered is incorrect.']);
        }

        DB::transaction(function () use ($validated) {
            $transactionIds = DB::table('orders')
                ->where('status', $validated['status'])
                ->whereNotNull('transaction_id')
                ->pluck('transaction_id');

            DB::table('orders')->where('status', $validated['status'])->delete();

            if ($transactionIds->isNotEmpty()) {
                Transaction::whereIn('transaction_id', $transactionIds)->delete();
            }
        });

        OrderUpdated::dispatch();
        TransactionUpdated::dispatch();

        return back()->with('success', "All {$validated['status']} orders erased successfully.");
    }
}
