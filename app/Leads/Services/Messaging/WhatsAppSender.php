<?php

namespace App\Leads\Services\Messaging;

use App\Leads\Enums\MessageType;
use App\Leads\Models\LeadConversation;
use App\Leads\Models\LeadMessage;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/**
 * Sends through the WhatsApp Cloud API (same calls as OptiFin).
 */
class WhatsAppSender implements MessageSender
{
    public function send(LeadConversation $conversation, string $body): SendResult
    {
        return $this->post($conversation, ['type' => 'text', 'text' => ['body' => $body]], 'WhatsApp rejected the message.');
    }

    public function sendMedia(LeadConversation $conversation, LeadMessage $message): SendResult
    {
        [$phoneNumberId, $token] = $this->credentials($conversation);

        if ($phoneNumberId === null || $token === null) {
            return SendResult::failure('WhatsApp credentials are not configured for this source.');
        }

        $disk = Storage::disk('local');

        if ($message->attachment_path === null || ! $disk->exists($message->attachment_path)) {
            return SendResult::failure('The attached file is no longer available.');
        }

        $upload = Http::withToken($token)->timeout(60)
            ->attach('file', $disk->get($message->attachment_path) ?? '', (string) $message->attachment_name, ['Content-Type' => (string) $message->attachment_mime])
            ->post("https://graph.facebook.com/v20.0/{$phoneNumberId}/media", ['messaging_product' => 'whatsapp', 'type' => $message->attachment_mime]);

        $mediaId = $upload->json('id');

        if (! $upload->successful() || ! is_string($mediaId) || $mediaId === '') {
            return SendResult::failure($upload->json('error.message') ?? 'WhatsApp rejected the file upload.', $upload->json());
        }

        $type = $message->message_type === MessageType::Image ? 'image' : 'document';
        $media = ['id' => $mediaId];

        if ($message->body !== null && $message->body !== '') {
            $media['caption'] = $message->body;
        }

        if ($type === 'document') {
            $media['filename'] = $message->attachment_name;
        }

        return $this->post($conversation, ['type' => $type, $type => $media], 'WhatsApp rejected the message.');
    }

    public function sendTemplate(LeadConversation $conversation, LeadMessage $message): SendResult
    {
        $template = ['name' => $message->template_name, 'language' => ['code' => $message->template_language]];
        $variables = $message->template_variables ?? [];

        if ($variables !== []) {
            $template['components'] = [[
                'type' => 'body',
                'parameters' => array_map(fn (string $value): array => ['type' => 'text', 'text' => $value], $variables),
            ]];
        }

        return $this->post($conversation, ['type' => 'template', 'template' => $template], 'WhatsApp rejected the template message.');
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function post(LeadConversation $conversation, array $payload, string $fallbackError): SendResult
    {
        [$phoneNumberId, $token] = $this->credentials($conversation);

        if ($phoneNumberId === null || $token === null) {
            return SendResult::failure('WhatsApp credentials are not configured for this source.');
        }

        $response = Http::withToken($token)->timeout(15)->post(
            "https://graph.facebook.com/v20.0/{$phoneNumberId}/messages",
            ['messaging_product' => 'whatsapp', 'to' => $conversation->external_thread_id, ...$payload],
        );

        return $this->result($response, 'messages.0.id', $fallbackError);
    }

    private function result(Response $response, string $idPath, string $fallbackError): SendResult
    {
        if (! $response->successful()) {
            return SendResult::failure($response->json('error.message') ?? $fallbackError, $response->json());
        }

        $id = $response->json($idPath);

        return SendResult::success(is_string($id) ? $id : null, $response->json());
    }

    /**
     * @return array{0: string|null, 1: string|null}
     */
    private function credentials(LeadConversation $conversation): array
    {
        $config = $conversation->leadSource->config ?? [];
        $id = $config['phone_number_id'] ?? null;
        $token = $config['access_token'] ?? null;

        return [is_string($id) && $id !== '' ? $id : null, is_string($token) && $token !== '' ? $token : null];
    }
}
