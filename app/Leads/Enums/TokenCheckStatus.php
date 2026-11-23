<?php

namespace App\Leads\Enums;

enum TokenCheckStatus: string
{
    case Valid = 'valid';
    case Invalid = 'invalid';
    case Missing = 'missing';
    case Unreachable = 'unreachable';
}
