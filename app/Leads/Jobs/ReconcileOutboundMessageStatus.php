<?php

namespace App\Leads\Jobs;

use App\Leads\Enums\MessageChannel;
use App\Leads\Enums\MessageDirection;
use App\Leads\Enums\MessageStatus;
use App\Leads\Events\LeadUpdated;
use App\Leads\Models\LeadConversation;
use App\Leads\Models\LeadMessage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Applies Meta's "delivered" / "read" / "failed" updates to messages staff
 * sent. A status only moves forward. A WhatsApp update can arrive before
 * the send finished saving its id, so a missing message is retried briefly.
 * Messenger/Instagram read receipts use a "watermark" time instead of ids.
 */
class ReconcileOutboundMessageStatus implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [5, 10, 20];

    /**
     * @param  array<int, string>  $externalMessageIds
     */
    public function __construct(
        public MessageChannel $channel,
        public MessageStatus $status,
        public ?string $externalMessageId = null,
        public array $externalMessageIds = [],
        public ?string $leadSourceId = null,
        public ?string $threadId = null,
        public ?int $watermarkTimestamp = null,
        public ?string $failureReason = null,
    ) {}

    public function handle(): void
    {
        if ($this->externalMessageId !== null) {
            $id = $this->find($this->externalMessageId);

            if ($id === null) {
                throw new RuntimeException("No sent message found for [{$this->externalMessageId}] yet.");
            }

            $this->apply($id);

            return;
        }

        foreach ($this->externalMessageIds as $mid) {
            if (($id = $this->find($mid)) !== null) {
                $this->apply($id);
            }
        }

        if ($this->watermarkTimestamp === null || $this->leadSourceId === null || $this->threadId === null) {
            return;
        }

        $conversation = LeadConversation::query()
            ->where('lead_source_id', $this->leadSourceId)
            ->where('channel', $this->channel)
            ->where('external_thread_id', $this->threadId)
            ->first();

        if ($conversation === null) {
            return;
        }

        LeadMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('direction', MessageDirection::Outbound)
            ->where('created_at', '<=', Carbon::createFromTimestamp($this->watermarkTimestamp))
            ->pluck('id')
            ->each(fn (string $id) => $this->apply($id));
    }

    private function find(string $externalId): ?string
    {
        $id = LeadMessage::query()->where('channel', $this->channel)->where('external_message_id', $externalId)->value('id');

        return is_string($id) ? $id : null;
    }

    private function apply(string $messageId): void
    {
        DB::transaction(function () use ($messageId): void {
            $message = LeadMessage::query()->whereKey($messageId)->lockForUpdate()->first();

            if ($message === null || $message->status === null || $this->status->rank() <= $message->status->rank()) {
                return;
            }

            $message->update([
                'status' => $this->status,
                'status_updated_at' => now(),
                'failure_reason' => $this->status === MessageStatus::Failed ? $this->failureReason : $message->failure_reason,
            ]);

            LeadUpdated::dispatch($message->lead_id);
        });
    }
}
