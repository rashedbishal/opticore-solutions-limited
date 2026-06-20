<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * One-time proof that a /success, /fail, or /cancel hit for a given
 * SSLCommerz transaction is the genuine browser redirect from that specific
 * checkout, not a replay of a leaked tran_id. Carried through the gateway's
 * `value_c` passthrough field, which SSLCommerz echoes back unchanged on
 * every callback for the transaction.
 */
class PaymentReturnToken
{
    private const TTL_MINUTES = 60;

    public static function generate(string $tranId): string
    {
        $token = Str::random(64);

        Cache::put(self::cacheKey($tranId), $token, now()->addMinutes(self::TTL_MINUTES));

        return $token;
    }

    /**
     * Single-use: the stored token is removed as soon as it's read, so a
     * replayed callback with the same tran_id never matches again.
     */
    public static function consume(string $tranId, ?string $providedToken): bool
    {
        $stored = Cache::pull(self::cacheKey($tranId));

        if (! is_string($stored) || ! is_string($providedToken) || $providedToken === '') {
            return false;
        }

        return hash_equals($stored, $providedToken);
    }

    private static function cacheKey(string $tranId): string
    {
        return "payment_return_token:{$tranId}";
    }
}
