<?php

namespace App\Http\Controllers\Auth;

use App\Events\UserPresenceUpdated;
use App\Http\Controllers\Controller;
use App\Mail\SecurityAlertMail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function create(): Response|RedirectResponse
    {
        if (Auth::guard('admin')->check()) {
            return redirect()->route('admin.home');
        }

        return Inertia::render('Auth/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        if (Auth::guard('admin')->check()) {
            return redirect()->route('admin.home');
        }

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Registration/social-login store emails lowercased; normalize the
        // login attempt the same way so a differently-cased but otherwise
        // correct email doesn't fail to match the stored row.
        $credentials['email'] = Str::lower($credentials['email']);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            $email = $credentials['email'];
            RateLimiter::clear(md5('login'.$email.'|'.$request->ip()));
            RateLimiter::clear(md5('login'.'account:'.$email));

            $user = Auth::user();
            Cache::put("user_chat_online_{$user->id}", true, now()->addMinutes(2));
            broadcast(new UserPresenceUpdated(userId: $user->id, online: true));

            if ($user->notify_security_alerts) {
                Mail::to($user->email)->queue(new SecurityAlertMail(
                    recipientName: $user->name,
                    type: 'login',
                    ip: $request->ip(),
                    userAgent: $request->userAgent() ?? 'Unknown',
                    time: now()->format('d M Y, H:i T'),
                ));
            }

            return redirect()->intended('/');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::user();

        if ($user) {
            Cache::forget("user_chat_online_{$user->id}");
            broadcast(new UserPresenceUpdated(userId: $user->id, online: false));
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
