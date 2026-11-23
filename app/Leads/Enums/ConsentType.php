<?php

namespace App\Leads\Enums;

enum ConsentType: string
{
    case Privacy = 'privacy';
    case Marketing = 'marketing';

    public function label(): string
    {
        return match ($this) {
            self::Privacy => 'Privacy / Data Processing Consent',
            self::Marketing => 'Marketing / Communication Consent',
        };
    }
}
