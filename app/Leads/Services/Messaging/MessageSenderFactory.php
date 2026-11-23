<?php

namespace App\Leads\Services\Messaging;

use App\Leads\Enums\MessageChannel;

class MessageSenderFactory
{
    public function for(MessageChannel $channel): MessageSender
    {
        return $channel === MessageChannel::Whatsapp
            ? app(WhatsAppSender::class)
            : app(PageMessagingSender::class);
    }
}
