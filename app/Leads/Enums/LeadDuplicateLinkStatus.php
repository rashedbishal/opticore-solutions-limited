<?php

namespace App\Leads\Enums;

enum LeadDuplicateLinkStatus: string
{
    case Pending = 'pending';
    case Dismissed = 'dismissed';
    case Merged = 'merged';
}
