<?php

namespace App\Http\Middleware;

use App\Support\AdminPermissions;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminHasPermission
{
    /**
     * Derive the CMS section permission key from the current route name
     * (the segment immediately following `admin.`) and ensure the
     * authenticated admin can access it. Dashboard, and any route whose
     * derived key isn't a registered section, are always allowed.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $admin = Auth::guard('admin')->user();

        if (! $admin) {
            return $next($request);
        }

        $routeName = $request->route()?->getName();

        if (! $routeName || ! str_starts_with($routeName, 'admin.')) {
            return $next($request);
        }

        $key = explode('.', substr($routeName, strlen('admin.')))[0];

        // Lead Management is gated by the admin's lead role, never by the
        // section-permission list (so `full_access` can't grant it), and its
        // settings are mother-admin-only. Both keys are deliberately absent
        // from AdminPermissions, so they must be handled before the
        // "unregistered key = allowed" fallback below.
        if ($key === 'leads') {
            abort_unless($admin->canUseLeads(), 403);

            return $next($request);
        }

        if ($key === 'lead-settings') {
            abort_unless($admin->isMotherAdmin(), 403);

            return $next($request);
        }

        if ($key === 'dashboard' || ! AdminPermissions::isValidKey($key)) {
            return $next($request);
        }

        // Every admin can always manage their own account (name, email,
        // password) regardless of whether they hold the `users` permission —
        // that permission gates *managing the admin roster*, not one's own
        // profile. Without this, a freshly created admin with no granted
        // sections couldn't even change their own password.
        if ($key === 'users' && in_array($routeName, ['admin.users.edit', 'admin.users.update'], true)) {
            $target = $request->route()?->parameter('user');
            $targetId = is_object($target) ? $target->getKey() : $target;

            if ($targetId !== null && (string) $targetId === (string) $admin->getKey()) {
                return $next($request);
            }
        }

        abort_unless($admin->canAccess($key), 403);

        return $next($request);
    }
}
