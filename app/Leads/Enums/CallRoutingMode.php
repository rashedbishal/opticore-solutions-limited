<?php

namespace App\Leads\Enums;

/** Who a call rang, decided once when it arrived. */
enum CallRoutingMode: string
{
    case Assignee = 'assignee';
    case BackupFallback = 'backup_fallback';
    case ManagerFallback = 'manager_fallback';
    case None = 'none';

    public function label(): string
    {
        return match ($this) {
            self::Assignee => 'the lead\'s person',
            self::BackupFallback => 'backup receivers',
            self::ManagerFallback => 'managers',
            self::None => 'nobody',
        };
    }
}
