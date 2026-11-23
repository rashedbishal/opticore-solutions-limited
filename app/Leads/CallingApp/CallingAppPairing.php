<?php

namespace App\Leads\CallingApp;

use App\Models\Admin;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Connecting a phone without a password in the app (as OptiFin): the
 * signed-in browser makes a short-lived one-time code; the app trades it
 * for its own token. The browser also keeps a secret marker whose hash is
 * saved on the device, so the CMS can tell "this browser is on the
 * connected phone" later.
 */
class CallingAppPairing
{
    /**
     * @return array{code: string, browser_marker: string, deep_link: string, expires_in: int}
     */
    public function issue(Admin $admin): array
    {
        $code = Str::random(48);
        $marker = Str::random(48);
        $ttl = (int) config('calling.calling_app.pairing_code_ttl_seconds');

        Cache::put(self::key($code), ['admin_id' => (int) $admin->id, 'browser_marker_hash' => hash('sha256', $marker)], $ttl);

        return [
            'code' => $code,
            'browser_marker' => $marker,
            'deep_link' => config('calling.calling_app.deep_link_scheme').'://pair?code='.$code,
            'expires_in' => $ttl,
        ];
    }

    /**
     * @return array{token: string, admin: Admin}|null
     */
    public function pair(string $code, ?string $deviceName): ?array
    {
        $key = self::key($code);
        $pending = Cache::lock($key.':lock', 5)->block(3, fn (): mixed => Cache::pull($key));
        $adminId = is_array($pending) ? ($pending['admin_id'] ?? null) : null;

        if (! is_int($adminId)) {
            return null;
        }

        $admin = Admin::query()->find($adminId);

        if ($admin === null || ! $admin->canUseLeads()) {
            return null;
        }

        return DB::transaction(function () use ($admin, $deviceName, $pending): array {
            CallingAppDevice::query()->where('admin_id', $admin->id)->get()->each->disconnect();

            $token = $admin->createToken('Calling app', [CallingAppDevice::TOKEN_ABILITY]);

            CallingAppDevice::query()->create([
                'admin_id' => $admin->id,
                'personal_access_token_id' => $token->accessToken->getKey(),
                'device_name' => $deviceName !== null ? mb_substr($deviceName, 0, 100) : null,
                'browser_marker_hash' => is_string($pending['browser_marker_hash'] ?? null) ? $pending['browser_marker_hash'] : null,
                'last_seen_at' => now(),
            ]);

            return ['token' => $token->plainTextToken, 'admin' => $admin];
        });
    }

    private static function key(string $code): string
    {
        return 'calling-app-pairing:'.hash('sha256', $code);
    }
}
