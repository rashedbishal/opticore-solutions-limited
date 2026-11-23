<?php

namespace App\Leads\Calling;

use App\Leads\Enums\CallingApiError;

final class CallingApiResult
{
    /**
     * @param  array<string, mixed>  $data
     */
    private function __construct(
        public readonly bool $successful,
        public readonly ?CallingApiError $error,
        public readonly ?int $metaCode,
        public readonly ?int $httpStatus,
        public readonly array $data,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function success(int $httpStatus, array $data): self
    {
        return new self(true, null, null, $httpStatus, $data);
    }

    public static function failure(CallingApiError $error, ?int $metaCode, ?int $httpStatus): self
    {
        return new self(false, $error, $metaCode, $httpStatus, []);
    }

    public function userMessage(): string
    {
        return $this->error?->userMessage() ?? '';
    }
}
