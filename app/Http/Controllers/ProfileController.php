<?php

namespace App\Http\Controllers;

use App\Events\UserPresenceUpdated;
use App\Mail\SecurityAlertMail;
use App\Models\Task;
use App\Models\Transaction;
use App\Support\InvoicePdfBuilder;
use App\Support\PendingOrderResolver;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\LaravelPdf\PdfBuilder;

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Profile', [
            'tasks' => Task::with(['subCategory', 'transaction'])
                ->where('user_id', $user->id)
                ->latest()
                ->get()
                ->map(fn (Task $task) => [
                    'id' => $task->id,
                    'task_name' => $task->task_name,
                    'category' => $task->category,
                    'sub_category' => $task->subCategory?->name,
                    'order_number' => $task->transaction?->order_number,
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
            'notifyOrderUpdates' => (bool) $user->notify_order_updates,
            'notifySecurityAlerts' => (bool) $user->notify_security_alerts,
            'notifyPromotionalEmails' => (bool) $user->notify_promotional_emails,
            'isSocialAccount' => (bool) ($user->google_id || $user->facebook_id),
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

    public function updatePassword(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();

        $user->update(['password' => Hash::make($request->password)]);

        if ($user->notify_security_alerts) {
            Mail::to($user->email)->queue(new SecurityAlertMail(
                recipientName: $user->name,
                type: 'password_change',
                ip: $request->ip(),
                userAgent: $request->userAgent() ?? 'Unknown',
                time: now()->format('d M Y, H:i T'),
            ));
        }

        return back()->with('password_updated', true);
    }

    public function updatePreferences(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'notify_order_updates' => ['sometimes', 'boolean'],
            'notify_security_alerts' => ['sometimes', 'boolean'],
            'notify_promotional_emails' => ['sometimes', 'boolean'],
        ]);

        $request->user()->update($validated);

        return back();
    }

    public function deleteAccount(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isSocialAccount = (bool) ($user->google_id || $user->facebook_id);

        if (! $isSocialAccount) {
            $request->validate([
                'password' => ['required', 'current_password'],
            ]);
        }

        Cache::forget("user_chat_online_{$user->id}");
        broadcast(new UserPresenceUpdated(userId: $user->id, online: false));

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Free the email for a future registration. Orders, invoices, and
        // workflow tasks stay intact and admin-visible — they key off this
        // row's id (Task) or their own independent email snapshot
        // (Transaction), never the live email below.
        $user->forceFill([
            'original_email' => $user->original_email ?? $user->email,
            'email' => "deleted-user-{$user->id}@deleted.invalid",
        ])->save();

        $user->delete();

        return redirect('/');
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
