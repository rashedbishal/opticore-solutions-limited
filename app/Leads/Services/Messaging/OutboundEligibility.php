<?php

namespace App\Leads\Services\Messaging;

use App\Leads\Enums\ConsentStatus;
use App\Leads\Enums\ConsentType;
use App\Leads\Enums\MessageChannel;
use App\Leads\Models\LeadConversation;

/**
 * Whether staff may message a lead on its conversation (same rules as
 * OptiFin): the channel is on and has its keys, privacy consent hasn't
 * been withdrawn, and — for free-form replies only — the person wrote in
 * the last 24 hours. Marketing consent is deliberately not checked for a
 * reply to someone who just wrote in.
 */
class OutboundEligibility
{
    public function forReply(LeadConversation $conversation): Eligibility
    {
        $common = $this->common($conversation);

        if ($common !== null) {
            return $common;
        }

        return $conversation->isWithinMessagingWindow()
            ? Eligibility::yes()
            : Eligibility::no('The 24-hour reply window has closed. Use a template instead.');
    }

    public function forTemplate(LeadConversation $conversation): Eligibility
    {
        if (! $conversation->channel->supportsTemplates()) {
            return Eligibility::no('Templates are only available on WhatsApp and Messenger.');
        }

        return $this->common($conversation) ?? Eligibility::yes();
    }

    private function common(LeadConversation $conversation): ?Eligibility
    {
        $privacy = $conversation->lead->consents()->where('consent_type', ConsentType::Privacy)->first();

        if ($privacy?->status === ConsentStatus::Withdrawn) {
            return Eligibility::no('Privacy consent has been withdrawn for this lead — messaging is blocked.');
        }

        $source = $conversation->leadSource;

        if (! $source->is_active) {
            return Eligibility::no('This channel is currently turned off.');
        }

        $config = $source->config ?? [];

        $configured = match ($conversation->channel) {
            MessageChannel::Whatsapp => ! empty($config['phone_number_id']) && ! empty($config['access_token']),
            MessageChannel::Messenger => ! empty($config['page_access_token']),
            MessageChannel::Instagram => ! empty($config['access_token']),
        };

        return $configured ? null : Eligibility::no("This channel isn't set up for sending yet.");
    }
}
