<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(): Response
    {
        $clients = User::withTrashed()
            ->where('role', '!=', 'admin')
            ->withCount(['conversations', 'tasks'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/Client/Index', [
            'clients' => $clients,
        ]);
    }

    public function show(User $user): Response
    {
        abort_if($user->isAdmin(), 403);

        $email = $user->email; // accessor returns original_email for trashed users

        $tasks = $user->tasks()
            ->with(['subCategory', 'transaction'])
            ->latest()
            ->get()
            ->map(fn (Task $t) => [
                'id' => $t->id,
                'task_name' => $t->task_name,
                'category' => $t->category,
                'sub_category' => $t->subCategory?->name,
                'state' => $t->state,
                'order_number' => $t->transaction?->order_number,
                'date' => $t->date?->format('Y-m-d'),
                'created_at' => $t->created_at?->format('Y-m-d H:i'),
            ]);

        $orders = DB::table('orders')
            ->leftJoin('portfolio_sub_categories', 'orders.subcategory_id', '=', 'portfolio_sub_categories.id')
            ->leftJoin('transactions', 'orders.transaction_id', '=', 'transactions.transaction_id')
            ->select('orders.id', 'orders.amount', 'orders.currency', 'orders.status', 'orders.category', 'orders.created_at', 'portfolio_sub_categories.name as subcategory_name', 'transactions.order_number')
            ->where('orders.email', $email)
            ->orderByDesc('orders.id')
            ->get();

        $transactions = Transaction::where('email', $email)
            ->latest()
            ->get(['transaction_id', 'order_number', 'amount', 'currency', 'status', 'tran_date', 'created_at', 'card_type']);

        $conversation = $user->conversation()->first();

        $messages = $conversation
            ? $conversation->messages()
                ->with(['offer.subCategory', 'offer.milestones'])
                ->latest()
                ->take(100)
                ->get()
                ->reverse()
                ->values()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'sender_type' => $m->sender_type,
                    'message' => $m->message,
                    'has_attachment' => (bool) $m->attachment_path,
                    'attachment_type' => $m->attachment_type,
                    'created_at' => $m->created_at?->format('Y-m-d H:i'),
                    'offer' => $m->offer ? [
                        'id' => $m->offer->id,
                        'conversation_id' => $m->offer->conversation_id,
                        'sub_category_id' => $m->offer->sub_category_id,
                        'category_slug' => $m->offer->category_slug,
                        'payment_type' => $m->offer->payment_type,
                        'description' => $m->offer->description,
                        'request_requirements' => $m->offer->request_requirements,
                        'price' => $m->offer->price,
                        'delivery_days' => $m->offer->delivery_days,
                        'revisions' => $m->offer->revisions,
                        'expires_at' => $m->offer->expires_at,
                        'status' => $m->offer->status,
                        'offer_token' => $m->offer->offer_token,
                        'sub_category' => $m->offer->subCategory ? [
                            'id' => $m->offer->subCategory->id,
                            'name' => $m->offer->subCategory->name,
                            'image' => $m->offer->subCategory->image ?? null,
                            'category_slug' => $m->offer->subCategory->category_slug,
                        ] : null,
                        'milestones' => $m->offer->milestones->map(fn ($ms) => [
                            'id' => $ms->id,
                            'offer_id' => $ms->offer_id,
                            'name' => $ms->name,
                            'description' => $ms->description,
                            'revisions' => $ms->revisions,
                            'delivery_days' => $ms->delivery_days,
                            'price' => $ms->price,
                            'sort_order' => $ms->sort_order,
                        ])->values()->all(),
                        'created_at' => $m->offer->created_at?->format('Y-m-d H:i'),
                    ] : null,
                ])
            : collect();

        return Inertia::render('Admin/Client/Show', [
            'client' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'address' => $user->address,
                'country' => $user->country,
                'avatar' => $user->avatar,
                'is_deleted' => $user->trashed(),
                'email_verified_at' => $user->email_verified_at?->format('Y-m-d H:i'),
                'created_at' => $user->created_at?->format('Y-m-d H:i'),
                'notify_order_updates' => $user->notify_order_updates,
                'notify_security_alerts' => $user->notify_security_alerts,
                'notify_promotional_emails' => $user->notify_promotional_emails,
            ],
            'tasks' => $tasks,
            'orders' => $orders,
            'transactions' => $transactions,
            'conversation_id' => $conversation?->id,
            'messages' => $messages,
        ]);
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->role === 'admin') {
            return back()->with('error', 'Cannot delete an admin account from the clients section.');
        }

        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $admin = auth('admin')->user();

        if (! Hash::check($request->password, $admin->password)) {
            return back()->withErrors(['password' => 'The password you entered is incorrect.']);
        }

        DB::transaction(function () use ($user) {
            foreach ($user->conversations as $conversation) {
                foreach ($conversation->offers as $offer) {
                    $offer->milestones()->delete();
                }
                $conversation->offers()->delete();
                $conversation->messages()->delete();
            }
            $user->conversations()->delete();
            $user->tasks()->delete();
            $user->forceDelete();
        });

        return back()->with('success', 'Client and all related data deleted successfully.');
    }
}
