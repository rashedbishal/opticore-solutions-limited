<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
        $clients = User::where('role', '!=', 'admin')
            ->withCount(['conversations', 'tasks'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/Client/Index', [
            'clients' => $clients,
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
            $user->delete();
        });

        return back()->with('success', 'Client and all related data deleted successfully.');
    }
}
