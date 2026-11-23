<?php

namespace App\Leads\Notifications;

use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * A system notification on the person's phone/computer for a ringing call
 * (or, with $ended, the signal that closes it). Uses the call id as the
 * tag, so the "ended" push replaces the ringing one.
 */
class IncomingCallPushNotification extends Notification
{
    public function __construct(
        public string $callId,
        public string $leadId,
        public string $callerName,
        public bool $ended = false,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush(object $notifiable, Notification $notification): WebPushMessage
    {
        $message = (new WebPushMessage)
            ->tag('wa-call-'.$this->callId)
            ->data(['type' => $this->ended ? 'ended' : 'ring', 'call_id' => $this->callId, 'url' => url('/admin/leads/'.$this->leadId)])
            ->options(['TTL' => $this->ended ? 60 : (int) config('calling.ring_ttl_seconds'), 'urgency' => 'high']);

        if ($this->ended) {
            return $message->title('Call ended')->body($this->callerName);
        }

        return $message
            ->title('Incoming WhatsApp call')
            ->body($this->callerName)
            ->icon('/apple-touch-icon.png')
            ->requireInteraction()
            ->vibrate([300, 200, 300, 200, 300]);
    }
}
