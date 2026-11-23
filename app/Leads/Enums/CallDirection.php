<?php

namespace App\Leads\Enums;

enum CallDirection: string
{
    case Inbound = 'inbound';
    case Outbound = 'outbound';
}
