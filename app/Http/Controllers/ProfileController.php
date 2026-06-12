<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Transaction;
use App\Support\InvoicePdfBuilder;
use App\Support\PendingOrderResolver;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\LaravelPdf\PdfBuilder;

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Profile', [
            'tasks' => Task::with('subCategory')
                ->where('user_id', $user->id)
                ->latest()
                ->get()
                ->map(fn (Task $task) => [
                    'id' => $task->id,
                    'task_name' => $task->task_name,
                    'category' => $task->category,
                    'sub_category' => $task->subCategory?->name,
                    'date' => $task->date?->format('Y-m-d'),
                    'state' => $task->state,
                    'image_url' => $task->image_path ? asset('storage/'.$task->image_path) : null,
                ]),
            'orders' => Transaction::with('subCategory')
                ->where('email', $user->email)
                ->where('status', 'Processing')
                ->latest()
                ->get()
                ->map(fn (Transaction $transaction) => [
                    'id' => $transaction->id,
                    'order_number' => $transaction->order_number,
                    'invoice_number' => $transaction->invoice_number,
                    'category' => $transaction->category,
                    'sub_category' => $transaction->subCategory?->name,
                    'amount' => $transaction->amount,
                    'currency' => $transaction->currency,
                    'transaction_id' => $transaction->transaction_id,
                    'date' => $transaction->created_at?->format('Y-m-d'),
                ]),
            'pendingOrders' => PendingOrderResolver::forUser($user),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'country' => ['nullable', 'string', 'max:100'],
        ]);

        $request->user()->update($validated);

        return redirect()->route('profile')->with('success', 'Profile updated successfully.');
    }

    public function downloadInvoice(Request $request, Transaction $transaction): PdfBuilder
    {
        abort_unless($transaction->email === $request->user()->email, 403);
        abort_unless($transaction->status === 'Processing' && $transaction->invoice_number, 404);

        return InvoicePdfBuilder::build($transaction)
            ->download("Invoice-{$transaction->invoice_number}.pdf");
    }

    public function verifyInvoice(Request $request, string $token): PdfBuilder
    {
        try {
            $transactionId = Crypt::decryptString(strtr($token, '-_', '+/'));
        } catch (DecryptException) {
            abort(404);
        }

        $transaction = Transaction::findOrFail($transactionId);

        abort_unless($transaction->email === $request->user()->email, 403);
        abort_unless($transaction->status === 'Processing' && $transaction->invoice_number, 404);

        return InvoicePdfBuilder::build($transaction)
            ->inline("Invoice-{$transaction->invoice_number}.pdf");
    }
}
