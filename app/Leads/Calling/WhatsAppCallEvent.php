<?php

namespace App\Leads\Calling;

use Illuminate\Support\Carbon;

/**
 * One `calls[]` item of a WhatsApp webhook (connect or terminate), parsed
 * and checked as OptiFin does. Anything unusable comes back as a reason
 * string instead.
 */
final class WhatsAppCallEvent
{
    public const string CONNECT = 'connect';

    public const string TERMINATE = 'terminate';

    public const int MAX_CALL_ID_LENGTH = 191;

    public const int MAX_SDP_BYTES = 16384;

    private function __construct(
        public readonly string $callId,
        public readonly string $event,
        public readonly ?string $callerPhone,
        public readonly ?string $callerName,
        public readonly ?string $phoneNumberId,
        public readonly int $timestamp,
        public readonly ?string $sdp,
        public readonly ?string $statusToken,
        public readonly bool $hasErrors,
        public readonly ?string $errorToken,
        public readonly ?int $startTime,
        public readonly ?int $endTime,
        public readonly ?int $duration,
    ) {}

    /**
     * @param  array<string, mixed>  $change
     */
    public static function fromWebhook(array $change, mixed $call): self|string
    {
        $value = $change['value'] ?? null;

        if (! is_array($call) || ! is_array($value)) {
            return 'malformed_call_item';
        }

        $callId = $call['id'] ?? null;

        if (! is_string($callId) || $callId === '') {
            return 'missing_call_id';
        }

        if (strlen($callId) > self::MAX_CALL_ID_LENGTH || preg_match('/\s/', $callId) === 1) {
            return 'invalid_call_id';
        }

        $event = $call['event'] ?? null;

        if ($event !== self::CONNECT && $event !== self::TERMINATE) {
            return 'unsupported_event';
        }

        $direction = $call['direction'] ?? null;

        if ($direction !== null && $direction !== 'USER_INITIATED') {
            return 'unsupported_direction';
        }

        $timestamp = self::parseTimestamp($call['timestamp'] ?? null, Carbon::now()->getTimestamp());

        if ($timestamp === null) {
            return 'invalid_timestamp';
        }

        $metadata = is_array($value['metadata'] ?? null) ? $value['metadata'] : [];
        $phoneNumberId = is_string($metadata['phone_number_id'] ?? null) && $metadata['phone_number_id'] !== '' ? $metadata['phone_number_id'] : null;
        [$callerPhone, $callerName] = self::resolveCaller($call, $value, $metadata);

        $sdp = null;

        if ($event === self::CONNECT) {
            $sdp = self::validateOffer($call['session'] ?? null);

            if (in_array($sdp, ['missing_offer', 'oversized_sdp', 'invalid_sdp'], true)) {
                return $sdp;
            }

            if ($callerPhone === null) {
                return 'unusable_caller';
            }
        }

        $errors = $value['errors'] ?? $call['errors'] ?? null;
        $hasErrors = is_array($errors) && $errors !== [];

        return new self(
            callId: $callId,
            event: $event,
            callerPhone: $callerPhone,
            callerName: $callerName,
            phoneNumberId: $phoneNumberId,
            timestamp: $timestamp,
            sdp: $sdp,
            statusToken: self::normalizeStatus($call['status'] ?? null),
            hasErrors: $hasErrors,
            errorToken: $hasErrors ? self::errorToken($errors) : null,
            startTime: self::positiveInt($call['start_time'] ?? null),
            endTime: self::positiveInt($call['end_time'] ?? null),
            duration: self::positiveInt($call['duration'] ?? null),
        );
    }

    public function isConnect(): bool
    {
        return $this->event === self::CONNECT;
    }

    public function pickedUp(): bool
    {
        return $this->startTime !== null;
    }

    public function matchesPhoneNumberId(mixed $configured): bool
    {
        if (! is_string($configured) || $configured === '' || $this->phoneNumberId === null) {
            return true;
        }

        return hash_equals($configured, $this->phoneNumberId);
    }

    public function rawMetaStatus(): ?string
    {
        return $this->errorToken ?? $this->statusToken;
    }

    public function statusMentions(string $token): bool
    {
        return $this->statusToken !== null && str_contains($this->statusToken, $token);
    }

    /**
     * Never dump the SDP (it carries ICE credentials).
     *
     * @return array<string, mixed>
     */
    public function __debugInfo(): array
    {
        return ['callId' => $this->callId, 'event' => $this->event, 'timestamp' => $this->timestamp];
    }

    /**
     * The caller is the first usable number that isn't the business's own.
     *
     * @param  array<string, mixed>  $call
     * @param  array<string, mixed>  $value
     * @param  array<string, mixed>  $metadata
     * @return array{0: string|null, 1: string|null}
     */
    private static function resolveCaller(array $call, array $value, array $metadata): array
    {
        $business = array_values(array_filter([self::digitsOf($metadata['display_phone_number'] ?? null), self::digitsOf($call['to'] ?? null)]));
        $contacts = is_array($value['contacts'] ?? null) ? $value['contacts'] : [];
        $candidates = [self::usablePhone($call['from'] ?? null)];

        foreach ($contacts as $contact) {
            $candidates[] = is_array($contact) ? self::usablePhone($contact['wa_id'] ?? null) : null;
        }

        foreach ($candidates as $candidate) {
            if ($candidate === null || in_array($candidate, $business, true)) {
                continue;
            }

            return [$candidate, self::contactName($contacts, $candidate)];
        }

        return [null, null];
    }

    /**
     * @param  array<int|string, mixed>  $contacts
     */
    private static function contactName(array $contacts, string $phone): ?string
    {
        foreach ($contacts as $contact) {
            if (! is_array($contact) || ($contact['wa_id'] ?? null) !== $phone) {
                continue;
            }

            $name = is_array($contact['profile'] ?? null) ? ($contact['profile']['name'] ?? null) : null;

            return is_string($name) && $name !== '' ? $name : null;
        }

        return null;
    }

    private static function usablePhone(mixed $phone): ?string
    {
        return is_string($phone) && preg_match('/^\d{5,20}$/', $phone) === 1 ? $phone : null;
    }

    private static function digitsOf(mixed $phone): ?string
    {
        if (! is_string($phone)) {
            return null;
        }

        $digits = preg_replace('/\D/', '', $phone);

        return is_string($digits) && $digits !== '' ? $digits : null;
    }

    private static function validateOffer(mixed $session): string
    {
        if (! is_array($session) || ($session['sdp_type'] ?? null) !== 'offer') {
            return 'missing_offer';
        }

        $sdp = $session['sdp'] ?? null;

        if (! is_string($sdp) || trim($sdp) === '') {
            return 'missing_offer';
        }

        if (strlen($sdp) > self::MAX_SDP_BYTES) {
            return 'oversized_sdp';
        }

        if (! str_starts_with(ltrim($sdp), 'v=0')) {
            return 'invalid_sdp';
        }

        return str_ends_with($sdp, "\n") ? $sdp : $sdp.(str_ends_with($sdp, "\r") ? "\n" : "\r\n");
    }

    private static function parseTimestamp(mixed $timestamp, int $fallback): ?int
    {
        if ($timestamp === null) {
            return $fallback;
        }

        if (is_int($timestamp)) {
            return $timestamp > 0 ? $timestamp : null;
        }

        return is_string($timestamp) && ctype_digit($timestamp) && (int) $timestamp > 0 ? (int) $timestamp : null;
    }

    private static function positiveInt(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value > 0 ? $value : null;
        }

        return is_string($value) && ctype_digit($value) && (int) $value > 0 ? (int) $value : null;
    }

    private static function normalizeStatus(mixed $status): ?string
    {
        $parts = is_array($status) ? array_values(array_filter($status, 'is_string')) : (is_string($status) ? [$status] : []);
        $token = preg_replace('/[^A-Z_|]/', '', strtoupper(implode('|', $parts)));

        return is_string($token) && $token !== '' ? substr($token, 0, 64) : null;
    }

    private static function errorToken(mixed $errors): string
    {
        $first = is_array($errors) ? reset($errors) : null;
        $code = is_array($first) ? ($first['code'] ?? null) : null;
        $safe = is_scalar($code) ? preg_replace('/[^A-Za-z0-9_.-]/', '', (string) $code) : null;

        return 'ERROR:'.(is_string($safe) && $safe !== '' ? substr($safe, 0, 40) : 'UNKNOWN');
    }
}
