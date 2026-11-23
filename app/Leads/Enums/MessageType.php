<?php

namespace App\Leads\Enums;

enum MessageType: string
{
    case Text = 'text';
    case Image = 'image';
    case Document = 'document';
    case Template = 'template';
}
