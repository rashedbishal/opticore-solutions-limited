<?php

namespace App\Leads\Services\Messaging;

final class SendResult
{
    /**
     * @param  array<string, mixed>|null  $raw
     */
    private function __construct(
        public readonly bool $successful,
        public readonly ?string $externalMessageId,
        public readonly ?string $failureReason,
        public readonly ?array $raw,
    ) {}

    /**
     * @param  array<string, mixed>|null  $raw
     */
    public static function success(?string $externalMessageId, ?array $raw = null): self
    {
        return new self(true, $externalMessageId, null, $raw);
    }

    /**
     * @param  array<string, mixed>|null  $raw
     */
    public static function failure(string $reason, ?array $raw = null): self
    {
        return new self(false, null, $reason, $raw);
    }
}
