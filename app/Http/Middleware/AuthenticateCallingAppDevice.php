<?php

namespace App\Http\Middleware;

use App\Leads\CallingApp\CallingAppDevice;
use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * After Sanctum: the token must be a calling-app token belonging to a
 * still-connected phone of an admin who still has a lead role. The admin is
 * then put on the `admin` guard (no session), so the very same call
 * controllers the browser uses work unchanged.
 */
class AuthenticateCallingAppDevice
{
    public function handle(Request $request, Closure $next): Response
    {
        $admin = $request->user('sanctum');
        $token = $admin instanceof Admin ? $admin->currentAccessToken() : null;

        if (! $admin instanceof Admin || ! $token instanceof PersonalAccessToken || ! $token->can(CallingAppDevice::TOKEN_ABILITY)) {
            return $this->error(401, 'unpaired', 'This phone is not connected.');
        }

        $device = CallingAppDevice::query()->where('personal_access_token_id', $token->getKey())->where('admin_id', $admin->id)->first();

        if ($device === null) {
            return $this->error(401, 'unpaired', 'This phone is not connected.');
        }

        if (! $admin->canUseLeads()) {
            return $this->error(403, 'account_inactive', 'Your account no longer has access to leads.');
        }

        Auth::guard('admin')->setUser($admin);
        $request->attributes->set('callingAppDevice', $device);

        if ($device->last_seen_at === null || $device->last_seen_at->lt(now()->subMinute())) {
            $device->forceFill(['last_seen_at' => now()])->save();
        }

        return $next($request);
    }

    private function error(int $status, string $code, string $message): Response
    {
        return response()->json(['error' => ['code' => $code, 'message' => $message, 'retryable' => false]], $status);
    }
}
