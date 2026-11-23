<?php

namespace App\Leads\Services\Messaging;

use App\Leads\Models\LeadConversation;
use App\Leads\Models\LeadMessage;

interface MessageSender
{
    public function send(LeadConversation $conversation, string $body): SendResult;

    public function sendMedia(LeadConversation $conversation, LeadMessage $message): SendResult;

    public function sendTemplate(LeadConversation $conversation, LeadMessage $message): SendResult;
}
