<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminSessionIsCurrent
{
    /**
     * Force-logout a regular admin whose authentication-relevant state
     * (password, full access, or permissions) has changed since their
     * session began — e.g. the mother admin changed their password or
     * role while they were logged in.
     *
     * The mother admin is exempt: nobody else can change their password
     * or permissions, and they may freely change their own password
     * without being signed out.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $admin = Auth::guard('admin')->user();

        if (! $admin || $admin->is_super_admin) {
            return $next($request);
        }

        $sessionKey = 'admin_security_stamp';
        $currentStamp = $admin->securityStamp();

        if (! $request->session()->has($sessionKey)) {
            $request->session()->put($sessionKey, $currentStamp);

            return $next($request);
        }

        if ($request->session()->get($sessionKey) !== $currentStamp) {
            Auth::guard('admin')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('admin.login')
                ->with('error', 'Your account was updated by an administrator. Please log in again.');
        }

        return $next($request);
    }
}
