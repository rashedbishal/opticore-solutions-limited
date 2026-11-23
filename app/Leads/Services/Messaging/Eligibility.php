<?php

namespace App\Leads\Services\Messaging;

final class Eligibility
{
    private function __construct(public readonly bool $eligible, public readonly ?string $reason) {}

    public static function yes(): self
    {
        return new self(true, null);
    }

    public static function no(string $reason): self
    {
        return new self(false, $reason);
    }
}
