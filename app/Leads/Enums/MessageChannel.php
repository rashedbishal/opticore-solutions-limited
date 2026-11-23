<?php

namespace App\Leads\Enums;

enum MessageChannel: string
{
    case Messenger = 'messenger';
    case Instagram = 'instagram';
    case Whatsapp = 'whatsapp';

    public function label(): string
    {
        return match ($this) {
            self::Messenger => 'Messenger',
            self::Instagram => 'Instagram',
            self::Whatsapp => 'WhatsApp',
        };
    }
}
