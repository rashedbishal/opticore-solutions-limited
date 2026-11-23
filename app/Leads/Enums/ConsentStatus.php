<?php

namespace App\Leads\Enums;

enum ConsentStatus: string
{
    case Granted = 'granted';
    case Withdrawn = 'withdrawn';
}
