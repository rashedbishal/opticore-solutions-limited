<?php

namespace App\Leads\Enums;

/**
 * Standard lead fields a website form can ask for. Name is always asked.
 */
enum WebsiteFormFixedField: string
{
    case Email = 'email';
    case Phone = 'phone';
    case Message = 'message';

    public function label(): string
    {
        return match ($this) {
            self::Email => 'Email',
            self::Phone => 'Phone',
            self::Message => 'Message',
        };
    }
}
