<?php

namespace App\Leads\Calling;

use App\Leads\Models\LeadSetting;
use Illuminate\Notifications\ChannelManager;
use Illuminate\Support\Facades\Notification;
use Minishlink\WebPush\VAPID;
use NotificationChannels\WebPush\PushSubscription;

/**
 * The push keys live in Lead Settings (encrypted), not .env: they're put
 * into the push package's config just before sending.
 */
class CallPush
{
    public function configured(): bool
    {
        $settings = LeadSetting::current();

        return $settings->vapid_public_key !== null && $settings->vapid_private_key !== null;
    }

    public function publicKey(): ?string
    {
        return LeadSetting::current()->vapid_public_key;
    }

    /** Apply the stored keys; false when none are set. */
    public function apply(): bool
    {
        $settings = LeadSetting::current();

        if ($settings->vapid_public_key === null || $settings->vapid_private_key === null) {
            return false;
        }

        config([
            'webpush.vapid.subject' => (string) config('app.url'),
            'webpush.vapid.public_key' => $settings->vapid_public_key,
            'webpush.vapid.private_key' => $settings->vapid_private_key,
        ]);

        // A long-running worker may hold a sender built with old keys.
        // (Under a notification fake there's nothing to reset.)
        if (! Notification::isFake()) {
            app(ChannelManager::class)->forgetDrivers();
        }

        return true;
    }

    /** New keys make every existing device subscription useless, so they go. */
    public function generate(): void
    {
        $keys = VAPID::createVapidKeys();

        LeadSetting::current()->update([
            'vapid_public_key' => $keys['publicKey'],
            'vapid_private_key' => $keys['privateKey'],
        ]);

        PushSubscription::query()->delete();
    }
}
