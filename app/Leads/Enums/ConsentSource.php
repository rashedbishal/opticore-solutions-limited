<?php

namespace App\Leads\Enums;

enum ConsentSource: string
{
    case Manual = 'manual';
    case Merge = 'merge';

    public function label(): string
    {
        return match ($this) {
            self::Manual => 'Manual',
            self::Merge => 'Lead Merge',
        };
    }
}
