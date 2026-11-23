<?php

namespace App\Leads\Enums;

enum LeadDistributionMode: string
{
    /** New leads stay unowned until a manager assigns them. */
    case Manual = 'manual';

    /** New leads are given to an agent automatically (see AutoDistributionMethod). */
    case Automatic = 'automatic';
}
