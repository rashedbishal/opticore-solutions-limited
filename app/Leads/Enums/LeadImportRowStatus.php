<?php

namespace App\Leads\Enums;

enum LeadImportRowStatus: string
{
    case Imported = 'imported';
    case Duplicate = 'duplicate';
    case Failed = 'failed';
}
