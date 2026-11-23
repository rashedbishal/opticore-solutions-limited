<?php

namespace App\Leads\Actions;

use App\Leads\Enums\MessageChannel;
use App\Leads\Enums\MessageDirection;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadConversation;
use App\Leads\Models\LeadMessage;
use App\Leads\Models\LeadSource;
use Illuminate\Support\Facades\DB;

/**
 * Saves one incoming chat message into the lead's conversation for that
 * person and channel (creating the conversation on their first message).
 * Messages are stored once, here — there is no second copy on the lead.
 */
class RecordInboundMessage
{
    /**
     * @param  array<string, mixed>|null  $metadata  the raw Meta payload item
     */
    public function handle(Lead $lead, LeadSource $source, MessageChannel $channel, string $externalThreadId, ?string $body, ?string $externalMessageId, ?array $metadata): LeadMessage
    {
        return DB::transaction(function () use ($lead, $source, $channel, $externalThreadId, $body, $externalMessageId, $metadata): LeadMessage {
            $conversation = LeadConversation::query()->firstOrCreate(
                ['lead_source_id' => $source->id, 'channel' => $channel, 'external_thread_id' => $externalThreadId],
                ['lead_id' => $lead->id],
            );

            $conversation->update(['last_inbound_at' => now()]);

            return LeadMessage::create([
                'conversation_id' => $conversation->id,
                'lead_id' => $conversation->lead_id,
                'channel' => $channel,
                'direction' => MessageDirection::Inbound,
                'message_type' => 'text',
                'body' => $body,
                'external_message_id' => $externalMessageId,
                'external_participant_id' => $externalThreadId,
                'metadata' => $metadata,
            ]);
        });
    }
}
