<?php

namespace App\Leads\Services\Messaging;

use App\Leads\Enums\MessageChannel;
use App\Leads\Enums\MessageType;
use App\Leads\Models\LeadConversation;
use App\Leads\Models\LeadMessage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/**
 * Sends Messenger and Instagram messages through Meta's Send API (same
 * calls as OptiFin). Messenger also sends Utility templates; Instagram has
 * no templates.
 */
class PageMessagingSender implements MessageSender
{
    public function send(LeadConversation $conversation, string $body): SendResult
    {
        return $this->sendMessage($conversation, ['text' => $body]);
    }

    public function sendMedia(LeadConversation $conversation, LeadMessage $message): SendResult
    {
        [$host, $token] = $this->target($conversation);

        if ($token === null) {
            return SendResult::failure("{$conversation->channel->label()} credentials are not configured for this source.");
        }

        $disk = Storage::disk('local');

        if ($message->attachment_path === null || ! $disk->exists($message->attachment_path)) {
            return SendResult::failure('The attached file is no longer available.');
        }

        $type = $message->message_type === MessageType::Image ? 'image' : 'file';
        $form = ['message' => json_encode(['attachment' => ['type' => $type, 'payload' => ['is_reusable' => true]]])];

        if ($conversation->channel === MessageChannel::Instagram) {
            $form['platform'] = 'instagram';
        }

        $upload = Http::withToken($token)->timeout(60)
            ->attach('filedata', $disk->get($message->attachment_path) ?? '', (string) $message->attachment_name, ['Content-Type' => (string) $message->attachment_mime])
            ->post("https://{$host}/v20.0/me/message_attachments", $form);

        $attachmentId = $upload->json('attachment_id');

        if (! $upload->successful() || ! is_string($attachmentId) || $attachmentId === '') {
            return SendResult::failure($upload->json('error.message') ?? "{$conversation->channel->label()} rejected the file upload.", $upload->json());
        }

        return $this->sendMessage($conversation, ['attachment' => ['type' => $type, 'payload' => ['attachment_id' => $attachmentId]]]);
    }

    public function sendTemplate(LeadConversation $conversation, LeadMessage $message): SendResult
    {
        if ($conversation->channel !== MessageChannel::Messenger) {
            return SendResult::failure('Template messages are only supported for WhatsApp and Messenger.');
        }

        $config = $conversation->leadSource->config ?? [];
        $pageId = $config['page_id'] ?? null;
        $token = $config['page_access_token'] ?? null;

        if (! is_string($pageId) || $pageId === '' || ! is_string($token) || $token === '') {
            return SendResult::failure('Messenger credentials are not configured for this source.');
        }

        $response = Http::withToken($token)->timeout(15)->post("https://graph.facebook.com/v26.0/{$pageId}/messages", [
            'recipient' => ['id' => $conversation->external_thread_id],
            'messaging_type' => 'UTILITY',
            'message' => ['template' => [
                'name' => $message->template_name,
                'language' => ['code' => $message->template_language],
                'components' => [[
                    'type' => 'body',
                    'parameters' => array_map(fn (string $value): array => ['type' => 'text', 'text' => $value], $message->template_variables ?? []),
                ]],
            ]],
        ]);

        if (! $response->successful()) {
            return SendResult::failure($response->json('error.message') ?? 'Messenger rejected the template message.', $response->json());
        }

        $id = $response->json('message_id');

        return SendResult::success(is_string($id) ? $id : null, $response->json());
    }

    /**
     * @param  array<string, mixed>  $message
     */
    private function sendMessage(LeadConversation $conversation, array $message): SendResult
    {
        [$host, $token] = $this->target($conversation);

        if ($token === null) {
            return SendResult::failure("{$conversation->channel->label()} credentials are not configured for this source.");
        }

        $payload = ['recipient' => ['id' => $conversation->external_thread_id], 'message' => $message];

        if ($conversation->channel === MessageChannel::Messenger) {
            $payload['messaging_type'] = 'RESPONSE';
        }

        $response = Http::withToken($token)->timeout(15)->post("https://{$host}/v20.0/me/messages", $payload);

        if (! $response->successful()) {
            return SendResult::failure($response->json('error.message') ?? "{$conversation->channel->label()} rejected the message.", $response->json());
        }

        $id = $response->json('message_id');

        return SendResult::success(is_string($id) ? $id : null, $response->json());
    }

    /**
     * @return array{0: string, 1: string|null}
     */
    private function target(LeadConversation $conversation): array
    {
        $config = $conversation->leadSource->config ?? [];

        if ($conversation->channel === MessageChannel::Messenger) {
            $token = $config['page_access_token'] ?? null;

            return ['graph.facebook.com', is_string($token) && $token !== '' ? $token : null];
        }

        $token = $config['access_token'] ?? null;
        $host = ($config['auth_mode'] ?? 'facebook') === 'instagram' ? 'graph.instagram.com' : 'graph.facebook.com';

        return [$host, is_string($token) && $token !== '' ? $token : null];
    }
}
