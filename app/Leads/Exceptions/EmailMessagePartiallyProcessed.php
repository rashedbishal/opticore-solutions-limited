<?php

namespace App\Leads\Exceptions;

use App\Leads\Enums\EmailPartialFailureStage;
use RuntimeException;
use Throwable;

/**
 * An email's lead was saved, but a later step failed. Recorded so the
 * retry finishes from that step rather than creating a second lead.
 */
class EmailMessagePartiallyProcessed extends RuntimeException
{
    public function __construct(
        public readonly string $leadId,
        public readonly EmailPartialFailureStage $stage,
        public readonly bool $isNewLead,
        Throwable $previous,
    ) {
        parent::__construct("Lead [{$leadId}] was saved but the {$stage->value} step failed: {$previous->getMessage()}", 0, $previous);
    }
}
