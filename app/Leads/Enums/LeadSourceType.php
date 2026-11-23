<?php

namespace App\Leads\Enums;

/**
 * Where a lead came from. Later phases add the chat/ads/email channels.
 */
enum LeadSourceType: string
{
    case Manual = 'manual';
    case ContactForm = 'contact_form';

    public function label(): string
    {
        return match ($this) {
            self::Manual => 'Manual',
            self::ContactForm => 'Website Contact Form',
        };
    }
}
