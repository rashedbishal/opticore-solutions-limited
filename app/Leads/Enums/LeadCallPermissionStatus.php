<?php

namespace App\Leads\Enums;

/** Whether a lead lets us call them on WhatsApp (Meta's call permission). */
enum LeadCallPermissionStatus: string
{
    case NoPermission = 'no_permission';
    case Requested = 'requested';
    case Temporary = 'temporary';
    case Permanent = 'permanent';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::NoPermission => 'Not allowed yet',
            self::Requested => 'Asked — waiting for an answer',
            self::Temporary => 'Allowed for now',
            self::Permanent => 'Always allowed',
            self::Rejected => 'Refused',
        };
    }
}
