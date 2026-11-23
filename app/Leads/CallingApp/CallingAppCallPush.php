<?php

namespace App\Leads\CallingApp;

use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;

/**
 * A data-only Firebase message to the phone app, in the exact format the
 * app understands (same as OptiFin): "incoming_call" or "call_ended".
 */
class CallingAppCallPush extends Notification
{
    /**
     * @param  array<string, string>  $data
     */
    private function __construct(public readonly string $type, public readonly array $data, public readonly int $ttlSeconds) {}

    public static function incomingCall(string $callId, ?string $leadName, ?string $leadPhone, int $ringSecondsLeft): self
    {
        return new self('incoming_call', [
            'call_id' => $callId,
            'lead_name' => (string) $leadName,
            'lead_phone' => (string) $leadPhone,
            'ring_seconds' => (string) $ringSecondsLeft,
        ], max(1, $ringSecondsLeft));
    }

    public static function callEnded(string $callId): self
    {
        return new self('call_ended', ['call_id' => $callId], 120);
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [FcmChannel::class];
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        return (new FcmMessage)
            ->data(['type' => $this->type, ...$this->data])
            ->custom([
                'android' => ['priority' => 'high', 'ttl' => $this->ttlSeconds.'s'],
                'apns' => ['headers' => ['apns-priority' => '10'], 'payload' => ['aps' => ['content-available' => 1]]],
            ]);
    }
}
