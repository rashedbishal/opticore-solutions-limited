<?php

namespace App\Http\Controllers\Admin;

use App\Events\OrderUpdated;
use App\Events\TransactionUpdated;
use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Task;
use App\Models\Transaction;
use App\Support\InvoicePdfBuilder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\LaravelPdf\PdfBuilder;

class TransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $transactions = Transaction::query()
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->where('status', $request->input('status'));
            })
            ->when($request->filled('date_from'), function ($query) use ($request) {
                $query->whereDate('created_at', '>=', $request->input('date_from'));
            })
            ->when($request->filled('date_to'), function ($query) use ($request) {
                $query->whereDate('created_at', '<=', $request->input('date_to'));
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->input('search');
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('transaction_id', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('transaction_id'), function ($query) use ($request) {
                $query->where('transaction_id', 'like', '%'.$request->input('transaction_id').'%');
            })
            ->when($request->filled('customer'), function ($query) use ($request) {
                $term = $request->input('customer');
                $query->where(function ($query) use ($term) {
                    $query->where('name', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%")
                        ->orWhere('phone', 'like', "%{$term}%");
                });
            })
            ->when($request->filled('invoice_number'), function ($query) use ($request) {
                $query->where('invoice_number', 'like', '%'.$request->input('invoice_number').'%');
            })
            ->when($request->filled('bank_tran_id'), function ($query) use ($request) {
                $query->where('bank_tran_id', 'like', '%'.$request->input('bank_tran_id').'%');
            })
            ->when($request->filled('card_no'), function ($query) use ($request) {
                $query->where('card_no', 'like', '%'.$request->input('card_no').'%');
            })
            ->when($request->filled('card_type'), function ($query) use ($request) {
                $query->where('card_type', $request->input('card_type'));
            })
            ->when($request->filled('card_issuer'), function ($query) use ($request) {
                $query->where('card_issuer', $request->input('card_issuer'));
            })
            ->when($request->filled('card_issuer_country'), function ($query) use ($request) {
                $query->where('card_issuer_country', $request->input('card_issuer_country'));
            })
            ->when($request->filled('currency_type'), function ($query) use ($request) {
                $query->where('currency_type', $request->input('currency_type'));
            })
            ->when($request->filled('risk_title'), function ($query) use ($request) {
                $query->where('risk_title', $request->input('risk_title'));
            })
            ->when($request->filled('amount_min') && is_numeric($request->input('amount_min')), function ($query) use ($request) {
                $query->where('amount', '>=', $request->input('amount_min'));
            })
            ->when($request->filled('amount_max') && is_numeric($request->input('amount_max')), function ($query) use ($request) {
                $query->where('amount', '<=', $request->input('amount_max'));
            })
            ->when($request->filled('store_amount_min') && is_numeric($request->input('store_amount_min')), function ($query) use ($request) {
                $query->where('store_amount', '>=', $request->input('store_amount_min'));
            })
            ->when($request->filled('store_amount_max') && is_numeric($request->input('store_amount_max')), function ($query) use ($request) {
                $query->where('store_amount', '<=', $request->input('store_amount_max'));
            })
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Transaction/Index', [
            'transactions' => $transactions,
            'filters' => $request->only([
                'status', 'date_from', 'date_to', 'search',
                'transaction_id', 'customer', 'invoice_number', 'bank_tran_id', 'card_no',
                'card_type', 'card_issuer', 'card_issuer_country', 'currency_type', 'risk_title',
                'amount_min', 'amount_max', 'store_amount_min', 'store_amount_max',
            ]),
            'filterOptions' => Cache::remember('admin.transactions.filter-options', now()->addMinutes(10), function () {
                return [
                    'cardTypes' => Transaction::query()->whereNotNull('card_type')->distinct()->orderBy('card_type')->pluck('card_type'),
                    'cardIssuers' => Transaction::query()->whereNotNull('card_issuer')->distinct()->orderBy('card_issuer')->pluck('card_issuer'),
                    'cardIssuerCountries' => Transaction::query()->whereNotNull('card_issuer_country')->distinct()->orderBy('card_issuer_country')->pluck('card_issuer_country'),
                    'currencyTypes' => Transaction::query()->whereNotNull('currency_type')->distinct()->orderBy('currency_type')->pluck('currency_type'),
                    'riskTitles' => Transaction::query()->whereNotNull('risk_title')->distinct()->orderBy('risk_title')->pluck('risk_title'),
                ];
            }),
        ]);
    }

    public function downloadInvoice(Transaction $transaction): PdfBuilder
    {
        $filename = 'Invoice-'.($transaction->invoice_number ?? $transaction->transaction_id).'.pdf';

        return InvoicePdfBuilder::build($transaction)->download($filename);
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
            $transactionIds = Transaction::where('status', $validated['status'])
                ->pluck('transaction_id');

            Transaction::where('status', $validated['status'])->delete();

            if ($transactionIds->isNotEmpty()) {
                DB::table('orders')->whereIn('transaction_id', $transactionIds)->delete();
            }
        });

        OrderUpdated::dispatch();
        TransactionUpdated::dispatch();

        return back()->with('success', "All {$validated['status']} transactions erased successfully.");
    }

    public function clearAll(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'admin_password' => ['required', 'string'],
            'mother_password' => ['required', 'string'],
        ]);

        $admin = Auth::guard('admin')->user();

        if (! $admin || ! Hash::check($validated['admin_password'], $admin->password)) {
            return back()->withErrors(['admin_password' => 'The password you entered is incorrect.']);
        }

        $motherAdmin = Admin::motherAdmin();

        if (! $motherAdmin || ! Hash::check($validated['mother_password'], $motherAdmin->password)) {
            return back()->withErrors(['mother_password' => 'The password you entered is incorrect.']);
        }

        DB::transaction(function () {
            $transactionIds = Transaction::query()->whereNotNull('transaction_id')->pluck('transaction_id');

            Transaction::query()->delete();

            if ($transactionIds->isNotEmpty()) {
                DB::table('orders')->whereIn('transaction_id', $transactionIds)->delete();
                Task::whereIn('transaction_id', $transactionIds)->delete();
            }
        });

        OrderUpdated::dispatch();
        TransactionUpdated::dispatch();

        return back()->with('success', 'All transactions and their linked orders and tasks were cleared successfully.');
    }
}
