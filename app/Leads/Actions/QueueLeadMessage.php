<?php

namespace App\Leads\Actions;

use App\Leads\Enums\MessageDirection;
use App\Leads\Enums\MessageStatus;
use App\Leads\Enums\MessageType;
use App\Leads\Jobs\SendOutboundMessage;
use App\Leads\Models\LeadConversation;
use App\Leads\Models\LeadMessage;
use App\Leads\Services\Messaging\OutboundMediaStorage;
use App\Models\Admin;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Saves a reply as "pending" and queues it to be sent. A picture/PDF with
 * text is one captioned message on WhatsApp, or a text message followed by
 * the file on Messenger/Instagram. The same message twice within 10 seconds
 * (double click) is refused.
 *
 * @return array<int, LeadMessage>|null null when it's a duplicate
 */
class QueueLeadMessage
{
    public function __construct(private readonly OutboundMediaStorage $storage) {}

    /**
     * @return array<int, LeadMessage>|null
     */
    public function handle(LeadConversation $conversation, Admin $sender, ?string $body, ?UploadedFile $file = null, ?MessageType $fileType = null): ?array
    {
        $body = $body !== null && trim($body) !== '' ? trim($body) : null;
        $fingerprint = $file !== null ? (string) hash_file('sha256', (string) $file->getRealPath()) : '';
        $lock = 'outbound-message:'.$conversation->id.':'.md5($body.'|'.$fingerprint);

        $created = Cache::lock($lock, 10)->get(function () use ($conversation, $sender, $body, $file, $fileType): array {
            $base = [
                'conversation_id' => $conversation->id,
                'lead_id' => $conversation->lead_id,
                'channel' => $conversation->channel,
                'direction' => MessageDirection::Outbound,
                'status' => MessageStatus::Pending,
                'status_updated_at' => now(),
                'sent_by' => $sender->id,
                'sent_by_name' => $sender->name,
            ];

            if ($file === null || $fileType === null) {
                return [LeadMessage::create([...$base, 'message_type' => MessageType::Text, 'body' => $body])];
            }

            $stored = $this->storage->store($file, $conversation, $fileType);

            try {
                return DB::transaction(function () use ($base, $stored, $body, $conversation): array {
                    $messages = [];

                    if ($body !== null && ! $conversation->channel->supportsMediaCaption()) {
                        $messages[] = LeadMessage::create([...$base, 'message_type' => MessageType::Text, 'body' => $body]);
                    }

                    $messages[] = LeadMessage::create([...$base, ...$stored, 'body' => $conversation->channel->supportsMediaCaption() ? $body : null]);

                    return $messages;
                });
            } catch (Throwable $e) {
                Storage::disk('local')->delete($stored['attachment_path']);

                throw $e;
            }
        });

        if (! is_array($created)) {
            return null;
        }

        foreach ($created as $message) {
            SendOutboundMessage::dispatch($message);
        }

        return $created;
    }
}
