<?php

namespace App\Leads\Services\Meta;

use App\Leads\Actions\RecordInboundMessage;
use App\Leads\Enums\LeadAttachmentStatus;
use App\Leads\Enums\LeadPriority;
use App\Leads\Enums\MessageChannel;
use App\Leads\Events\LeadUpdated;
use App\Leads\Jobs\DownloadLeadAttachment;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadConversation;
use App\Leads\Models\LeadMessage;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadStatus;
use App\Leads\Services\LeadIntake;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Turns Meta webhook items into leads, the same way OptiFin does: a new
 * person's first message creates a lead; later messages from them attach
 * to that lead; a repeated delivery of the same message is ignored. Each
 * person is handled under a short lock so two messages arriving together
 * can't create two leads.
 *
 * A Illuminate\Contracts\Cache\LockTimeoutException escapes to the
 * webhook controller, which then asks Meta to retry the delivery.
 */
class InboundChannels
{
    public function __construct(
        private readonly MetaGraph $graph,
        private readonly LeadIntake $intake,
        private readonly RecordInboundMessage $recordMessage,
    ) {}

    /**
     * @param  array<string, mixed>  $messaging  one entry[].messaging[] item
     */
    public function messengerItem(LeadSource $source, array $messaging): void
    {
        $this->messagingItem($source, $messaging, MessageChannel::Messenger, 'facebook_user_id', 'facebook_profile_pic', 'Facebook User', 'facebook_messenger',
            fn (string $senderId): array => $this->graph->facebookProfile($senderId, $source->config['page_access_token'] ?? null));
    }

    /**
     * @param  array<string, mixed>  $messaging  one entry[].messaging[] item
     */
    public function instagramItem(LeadSource $source, array $messaging): void
    {
        $this->messagingItem($source, $messaging, MessageChannel::Instagram, 'instagram_user_id', 'instagram_profile_pic', 'Instagram User', 'instagram',
            fn (string $senderId): array => $this->graph->instagramProfile($senderId, $source->config['access_token'] ?? null, (string) ($source->config['auth_mode'] ?? 'facebook')));
    }

    /**
     * @param  array<string, mixed>  $change  the entry[].changes[] item
     * @param  array<string, mixed>  $message  one value.messages[] item
     */
    public function whatsappMessage(LeadSource $source, array $change, array $message): void
    {
        $phone = is_string($message['from'] ?? null) && $message['from'] !== '' ? $message['from'] : null;
        $attachment = $this->whatsappAttachment($message);
        $text = $message['text']['body'] ?? $attachment['caption'] ?? null;
        $sentAt = isset($message['timestamp']) ? Carbon::createFromTimestamp((int) $message['timestamp']) : now();
        $externalId = $this->messageId($message);

        $handle = function () use ($source, $change, $message, $phone, $attachment, $text, $sentAt, $externalId): void {
            if ($this->alreadyRecorded(MessageChannel::Whatsapp, $externalId)) {
                return;
            }

            $lead = $this->leadForThread($source, MessageChannel::Whatsapp, $phone)
                ?? ($phone !== null ? Lead::query()->withMerged()->where('source_id', $source->id)->where('phone', $phone)->first()?->latestVersion() : null);

            if ($lead !== null) {
                $this->appendText($lead, $text);
                $this->record($lead, $source, MessageChannel::Whatsapp, $phone, $text, $externalId, $message);
                $this->queueAttachment($lead, 'whatsapp', $attachment, $phone ?? 'unknown', $sentAt);
                $source->update(['last_synced_at' => now()]);
                LeadUpdated::dispatch($lead->id);

                return;
            }

            $lead = $this->createLead($source, [
                'name' => $this->whatsappContactName($change, $phone) ?? 'WhatsApp User '.($phone ?? 'unknown'),
                'phone' => $phone,
                'message' => $text,
            ]);

            $this->record($lead, $source, MessageChannel::Whatsapp, $phone, $text, $externalId, $message);
            $this->queueAttachment($lead, 'whatsapp', $attachment, $phone ?? 'unknown', $sentAt);
            $this->intake->received($lead);
        };

        $phone !== null ? $this->withLock($source->id, $phone, $handle) : $handle();
    }

    /**
     * One Lead Ads submission (a `leadgen` change). The answers are fetched
     * from Meta; if that fails the lead is still created so nothing is lost.
     *
     * @param  array<string, mixed>  $value
     */
    public function leadAd(LeadSource $source, array $value): void
    {
        $leadgenId = $value['leadgen_id'] ?? null;

        if (! is_string($leadgenId) || $leadgenId === '') {
            Log::warning('Facebook lead ad webhook had no leadgen_id.');

            return;
        }

        $token = $source->config['page_access_token'] ?? null;

        if (! is_string($token) || $token === '') {
            Log::error("Facebook lead ad [{$leadgenId}]: no Page Access Token configured on the Lead Ads source.");

            return;
        }

        $this->withLock($source->id, $leadgenId, function () use ($source, $leadgenId, $value, $token): void {
            if (Lead::query()->withMerged()->where('source_id', $source->id)->where('source_data->leadgen_id', $leadgenId)->exists()) {
                return;
            }

            $fetched = $this->graph->leadgen($leadgenId, $token);
            $mapped = $fetched !== null ? $this->mapLeadgenFields($fetched['field_data']) : ['name' => null, 'email' => null, 'phone' => null];
            $formId = $value['form_id'] ?? null;

            $lead = $this->createLead($source, [
                'name' => $mapped['name'] ?? 'Facebook Lead '.substr($leadgenId, -4),
                'email' => $mapped['email'],
                'phone' => $mapped['phone'],
                'source_data' => [
                    'leadgen_id' => $leadgenId,
                    'page_id' => $value['page_id'] ?? null,
                    'form_id' => $formId,
                    'form_name' => is_string($formId) ? $this->graph->leadFormName($formId, $token) : null,
                    'ad_id' => $fetched['ad_id'] ?? ($value['ad_id'] ?? null),
                    'field_data' => $fetched['field_data'] ?? null,
                    'fetch_failed' => $fetched === null,
                ],
            ]);

            $this->intake->received($lead);
        }, lockSeconds: 30, blockSeconds: 15);
    }

    /**
     * @param  array<string, mixed>  $messaging
     * @param  callable(string): array{name: string|null, profile_pic: string|null}  $profile
     */
    private function messagingItem(LeadSource $source, array $messaging, MessageChannel $channel, string $idKey, string $picKey, string $placeholder, string $platform, callable $profile): void
    {
        $senderId = (string) ($messaging['sender']['id'] ?? 'unknown');
        $text = $messaging['message']['text'] ?? null;
        $attachments = $this->messagingAttachments($messaging);
        $sentAt = isset($messaging['timestamp']) ? Carbon::createFromTimestampMs((int) $messaging['timestamp']) : now();
        $externalId = $this->messageId($messaging);

        $this->withLock($source->id, $senderId, function () use ($source, $messaging, $channel, $idKey, $picKey, $placeholder, $platform, $profile, $senderId, $text, $attachments, $sentAt, $externalId): void {
            if ($this->alreadyRecorded($channel, $externalId)) {
                return;
            }

            $lead = $this->leadForThread($source, $channel, $senderId)
                ?? Lead::query()->withMerged()->where('source_id', $source->id)->where("source_data->{$idKey}", $senderId)->first()?->latestVersion();

            if ($lead !== null) {
                // A lead created while the profile lookup failed gets its
                // real name once Meta answers.
                if ($lead->name === "{$placeholder} {$senderId}") {
                    $found = $profile($senderId);

                    if ($found['name'] !== null) {
                        $lead->name = $found['name'];
                        $lead->source_data = [...($lead->source_data ?? []), $picKey => $found['profile_pic']];
                    }
                }

                $this->appendText($lead, $text);
                $this->record($lead, $source, $channel, $senderId, $text, $externalId, $messaging);

                foreach ($attachments as $attachment) {
                    $this->queueAttachment($lead, $platform, $attachment, $senderId, $sentAt);
                }

                $source->update(['last_synced_at' => now()]);
                LeadUpdated::dispatch($lead->id);

                return;
            }

            $found = $profile($senderId);

            $lead = $this->createLead($source, [
                'name' => $found['name'] ?? "{$placeholder} {$senderId}",
                'message' => $text,
                'source_data' => [$idKey => $senderId, $picKey => $found['profile_pic']],
            ]);

            $this->record($lead, $source, $channel, $senderId, $text, $externalId, $messaging);

            foreach ($attachments as $attachment) {
                $this->queueAttachment($lead, $platform, $attachment, $senderId, $sentAt);
            }

            $this->intake->received($lead);
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function createLead(LeadSource $source, array $attributes): Lead
    {
        $lead = DB::transaction(fn (): Lead => Lead::create([
            'source_id' => $source->id,
            'status_id' => LeadStatus::initial()?->id,
            'priority' => LeadPriority::Medium,
            ...$attributes,
        ]));

        $source->update(['last_synced_at' => now()]);

        return $lead;
    }

    private function appendText(Lead $lead, ?string $text): void
    {
        if ($text !== null && $text !== '') {
            $lead->message = trim(($lead->message ?? '')."\n".$text);
        }

        $lead->save();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function record(Lead $lead, LeadSource $source, MessageChannel $channel, ?string $threadId, ?string $body, ?string $externalId, array $payload): void
    {
        if ($threadId === null || $threadId === '' || $threadId === 'unknown') {
            return;
        }

        $this->recordMessage->handle($lead, $source, $channel, $threadId, $body, $externalId, $payload);
    }

    /**
     * @param  array{type: string, url?: string, media_id?: string, caption?: string|null}|null  $attachment
     */
    private function queueAttachment(Lead $lead, string $platform, ?array $attachment, string $senderId, CarbonInterface $sentAt): void
    {
        if ($attachment === null || $lead->source->metaAccessToken() === null) {
            return;
        }

        $pending = $lead->attachments()->create([
            'type' => $attachment['type'],
            'status' => LeadAttachmentStatus::Downloading,
            'sent_at' => $sentAt,
        ]);

        DownloadLeadAttachment::dispatch($pending, $senderId, $platform, $attachment['url'] ?? null, $attachment['media_id'] ?? null);
    }

    private function leadForThread(LeadSource $source, MessageChannel $channel, ?string $threadId): ?Lead
    {
        if ($threadId === null || $threadId === '' || $threadId === 'unknown') {
            return null;
        }

        return LeadConversation::query()
            ->where('lead_source_id', $source->id)
            ->where('channel', $channel)
            ->where('external_thread_id', $threadId)
            ->first()
            ?->lead;
    }

    private function alreadyRecorded(MessageChannel $channel, ?string $externalId): bool
    {
        return $externalId !== null
            && LeadMessage::query()->where('channel', $channel)->where('external_message_id', $externalId)->exists();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function messageId(array $payload): ?string
    {
        $id = $payload['message']['mid'] ?? $payload['id'] ?? null;

        return is_string($id) && $id !== '' ? $id : null;
    }

    /**
     * @param  array<string, mixed>  $messaging
     * @return array<int, array{type: string, url: string}>
     */
    private function messagingAttachments(array $messaging): array
    {
        $found = [];

        foreach (($messaging['message']['attachments'] ?? []) as $attachment) {
            $type = $attachment['type'] ?? null;
            $url = $attachment['payload']['url'] ?? null;

            if (in_array($type, ['image', 'video', 'audio', 'file'], true) && is_string($url) && $url !== '') {
                $found[] = ['type' => $type, 'url' => $url];
            }
        }

        return $found;
    }

    /**
     * @param  array<string, mixed>  $message
     * @return array{type: string, media_id: string, caption: string|null}|null
     */
    private function whatsappAttachment(array $message): ?array
    {
        $type = $message['type'] ?? null;

        if (! in_array($type, ['image', 'video', 'audio', 'document', 'sticker'], true)) {
            return null;
        }

        $mediaId = $message[$type]['id'] ?? null;

        if (! is_string($mediaId) || $mediaId === '') {
            return null;
        }

        return ['type' => $type, 'media_id' => $mediaId, 'caption' => $message[$type]['caption'] ?? null];
    }

    /**
     * @param  array<string, mixed>  $change
     */
    private function whatsappContactName(array $change, ?string $phone): ?string
    {
        foreach (($change['value']['contacts'] ?? []) as $contact) {
            if ($phone !== null && ($contact['wa_id'] ?? null) === $phone) {
                $name = $contact['profile']['name'] ?? null;

                return is_string($name) && $name !== '' ? $name : null;
            }
        }

        return null;
    }

    /**
     * @param  array<int, mixed>  $fieldData
     * @return array{name: string|null, email: string|null, phone: string|null}
     */
    private function mapLeadgenFields(array $fieldData): array
    {
        $values = [];

        foreach ($fieldData as $field) {
            $key = strtolower((string) ($field['name'] ?? ''));
            $value = $field['values'][0] ?? null;

            if ($key !== '' && is_string($value) && $value !== '') {
                $values[$key] = $value;
            }
        }

        $firstLast = trim(($values['first_name'] ?? '').' '.($values['last_name'] ?? ''));

        return [
            'name' => $values['full_name'] ?? ($firstLast !== '' ? $firstLast : null) ?? $values['email'] ?? null,
            'email' => $values['email'] ?? null,
            'phone' => $values['phone_number'] ?? $values['phone'] ?? null,
        ];
    }

    private function withLock(string $sourceId, string $key, callable $callback, int $lockSeconds = 10, int $blockSeconds = 5): mixed
    {
        return Cache::lock("lead-webhook-dedupe:{$sourceId}:{$key}", $lockSeconds)->block($blockSeconds, $callback);
    }
}
