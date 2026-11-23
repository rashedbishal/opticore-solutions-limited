<?php

namespace App\Leads\Calling;

use App\Leads\Models\LeadCall;

/**
 * What a call action (claim/answer/accept/reject/hang up) returns to the
 * call box: the call, the offer to answer (claim only), or an error code.
 */
final class LeadCallActionResult
{
    /**
     * @param  array{sdp_type: string, sdp: string}|null  $session
     */
    private function __construct(
        public readonly bool $ok,
        public readonly int $status,
        public readonly ?LeadCall $call,
        public readonly ?array $session,
        public readonly ?string $errorCode,
        public readonly ?string $message,
        public readonly bool $retryable,
    ) {}

    /**
     * @param  array{sdp_type: string, sdp: string}|null  $session
     */
    public static function success(LeadCall $call, ?array $session = null): self
    {
        return new self(true, 200, $call, $session, null, null, false);
    }

    public static function error(int $status, string $code, string $message, bool $retryable = false): self
    {
        return new self(false, $status, null, null, $code, $message, $retryable);
    }

    public static function notFound(): self
    {
        return self::error(404, 'not_found', 'This call could not be found.');
    }
}
