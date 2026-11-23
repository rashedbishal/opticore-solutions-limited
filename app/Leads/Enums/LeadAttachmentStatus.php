<?php

namespace App\Leads\Enums;

enum LeadAttachmentStatus: string
{
    case Downloading = 'downloading';
    case Downloaded = 'downloaded';
    case Failed = 'failed';
}
