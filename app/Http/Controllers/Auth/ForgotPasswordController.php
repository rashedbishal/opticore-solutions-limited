<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class ForgotPasswordController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        try {
            // Deliberately ignore the returned status (sent / throttled /
            // no such user) and always show the same response. Branching on
            // it would let an attacker use this form to enumerate which
            // emails have an account.
            Password::sendResetLink($request->only('email'));
        } catch (\Exception $e) {
            Log::error('Password reset email failed.', ['message' => $e->getMessage()]);

            return back()->withErrors(['email' => 'Unable to send reset link. Please try again later.']);
        }

        return back()->with('status', 'If an account exists for that email address, we have emailed a password reset link.');
    }
}
