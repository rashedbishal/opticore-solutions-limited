<?php

namespace App\Leads\Jobs;

use App\Leads\Calling\CallPush;
use App\Leads\Enums\CallDirection;
use App\Leads\Models\LeadCall;
use App\Leads\Notifications\IncomingCallPushNotification;
use App\Models\Admin;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use NotificationChannels\WebPush\PushSubscription;

/**
 * Wakes the ringing people's devices for an incoming call, and later tells
 * those same devices the ringing is over. Only devices that got a "ring"
 * get an "ended".
 */
class SendCallPush implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public function __construct(public string $callId, public bool $ended) {}

    public function handle(CallPush $push): void
    {
        $call = LeadCall::query()->with('lead')->find($this->callId);

        if ($call === null || $call->direction !== CallDirection::Inbound || $call->lead === null || ! $push->apply()) {
            return;
        }

        $marker = "wa-call-pushed:{$call->id}";

        if ($this->ended && ! Cache::pull($marker)) {
            return;
        }

        // Admins live in a separate database, so find the subscribed ones
        // from the subscriptions side rather than with a join.
        $subscribed = PushSubscription::query()
            ->where('subscribable_type', (new Admin)->getMorphClass())
            ->whereIn('subscribable_id', array_map('intval', $call->routed_user_ids ?? []))
            ->pluck('subscribable_id')
            ->unique()
            ->all();
        $recipients = $subscribed === [] ? collect() : Admin::query()->whereKey($subscribed)->get();

        if ($recipients->isEmpty()) {
            return;
        }

        foreach ($recipients as $admin) {
            $admin->notify(new IncomingCallPushNotification($call->id, $call->lead_id, $call->lead->name, $this->ended));
        }

        if (! $this->ended) {
            Cache::put($marker, true, now()->addMinutes(10));
        }
    }
}
