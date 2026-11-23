<?php

namespace App\Leads\Jobs;

use App\Leads\Enums\MessageStatus;
use App\Leads\Enums\MessageType;
use App\Leads\Events\LeadUpdated;
use App\Leads\Models\LeadMessage;
use App\Leads\Services\Messaging\MessageSenderFactory;
use App\Leads\Services\Messaging\OutboundEligibility;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Sends one queued message to Meta, re-checking it's still allowed at the
 * moment of sending. Only a message still "pending" is ever sent, so a
 * retry can never send it twice.
 */
class SendOutboundMessage implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [5, 15, 30];

    public function __construct(public LeadMessage $message) {}

    public function handle(OutboundEligibility $eligibility, MessageSenderFactory $senders): void
    {
        if (! LeadMessage::query()->whereKey($this->message->getKey())->exists()) {
            return;
        }

        $this->message->refresh();

        if ($this->message->status !== MessageStatus::Pending) {
            return;
        }

        $conversation = $this->message->conversation;
        $isTemplate = $this->message->message_type === MessageType::Template;
        $allowed = $isTemplate ? $eligibility->forTemplate($conversation) : $eligibility->forReply($conversation);

        if (! $allowed->eligible) {
            $this->markFailed($allowed->reason);

            return;
        }

        $sender = $senders->for($this->message->channel);

        $result = match (true) {
            $isTemplate => $sender->sendTemplate($conversation, $this->message),
            $this->message->hasMedia() => $sender->sendMedia($conversation, $this->message),
            default => $sender->send($conversation, (string) $this->message->body),
        };

        if (! $result->successful) {
            $this->markFailed($result->failureReason);

            return;
        }

        $this->message->update([
            'external_message_id' => $result->externalMessageId,
            'status' => MessageStatus::Sent,
            'status_updated_at' => now(),
            'metadata' => $result->raw,
        ]);

        $conversation->update(['last_outbound_at' => now()]);

        // The first message that actually reached the lead counts as first contact.
        DB::table('leads')->where('id', $this->message->lead_id)->whereNull('first_contacted_at')->update(['first_contacted_at' => now()]);

        LeadUpdated::dispatch($this->message->lead_id);
    }

    public function failed(?Throwable $exception): void
    {
        if (! LeadMessage::query()->whereKey($this->message->getKey())->exists()) {
            return;
        }

        $this->message->refresh();

        if ($this->message->status === MessageStatus::Pending) {
            $this->markFailed('Could not be sent due to a temporary system error. Please try again.');
        }
    }

    private function markFailed(?string $reason): void
    {
        $this->message->update(['status' => MessageStatus::Failed, 'status_updated_at' => now(), 'failure_reason' => $reason]);

        LeadUpdated::dispatch($this->message->lead_id);
    }
}
