<?php

namespace App\Leads\Calling;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Throwable;

/**
 * The caller's offer and our answer live only in the cache, encrypted
 * (they carry ICE credentials) — never in the database or logs.
 */
final class LeadCallSdp
{
    public static function offerKey(string $sourceId, string $callId): string
    {
        return "wa-call-offer:{$sourceId}:{$callId}";
    }

    public static function answerKey(string $sourceId, string $callId): string
    {
        return "wa-call-answer:{$sourceId}:{$callId}";
    }

    public static function storeOffer(string $sourceId, string $callId, string $sdp): bool
    {
        return self::store(self::offerKey($sourceId, $callId), $sdp, (int) config('calling.offer_ttl_seconds'));
    }

    public static function storeAnswer(string $sourceId, string $callId, string $sdp): bool
    {
        return self::store(self::answerKey($sourceId, $callId), $sdp, (int) config('calling.answer_ttl_seconds'));
    }

    public static function readOffer(string $sourceId, string $callId): ?string
    {
        return self::read(self::offerKey($sourceId, $callId));
    }

    public static function readAnswer(string $sourceId, string $callId): ?string
    {
        return self::read(self::answerKey($sourceId, $callId));
    }

    public static function hasOffer(string $sourceId, string $callId): bool
    {
        try {
            return Cache::has(self::offerKey($sourceId, $callId));
        } catch (Throwable) {
            return false;
        }
    }

    public static function forget(string $sourceId, string $callId): void
    {
        try {
            Cache::forget(self::offerKey($sourceId, $callId));
            Cache::forget(self::answerKey($sourceId, $callId));
        } catch (Throwable) {
            // Expires by itself.
        }
    }

    /** A browser answer SDP, checked and given a final line break. */
    public static function normalizeAnswer(mixed $sdp): ?string
    {
        if (! is_string($sdp) || $sdp === '' || strlen($sdp) > WhatsAppCallEvent::MAX_SDP_BYTES || ! str_starts_with($sdp, 'v=0')) {
            return null;
        }

        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $sdp) === 1 || preg_match('/^m=/m', $sdp) !== 1) {
            return null;
        }

        return str_ends_with($sdp, "\n") ? $sdp : $sdp.(str_ends_with($sdp, "\r") ? "\n" : "\r\n");
    }

    private static function store(string $key, string $sdp, int $ttl): bool
    {
        for ($attempt = 0; $attempt < 2; $attempt++) {
            try {
                if (Cache::put($key, Crypt::encryptString($sdp), Carbon::now()->addSeconds($ttl))) {
                    return true;
                }
            } catch (Throwable) {
                // Try once more.
            }
        }

        return false;
    }

    private static function read(string $key): ?string
    {
        try {
            $value = Cache::get($key);

            return is_string($value) ? Crypt::decryptString($value) : null;
        } catch (Throwable) {
            return null;
        }
    }
}
