<?php

namespace App\Leads\Enums;

enum LeadImportStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Completed = 'completed';
    case CompletedWithErrors = 'completed_with_errors';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Waiting',
            self::Processing => 'Importing…',
            self::Completed => 'Done',
            self::CompletedWithErrors => 'Done, with problems',
            self::Failed => 'Failed',
        };
    }

    public function isFinished(): bool
    {
        return in_array($this, [self::Completed, self::CompletedWithErrors, self::Failed], true);
    }
}
