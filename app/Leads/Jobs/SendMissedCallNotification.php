<?php

namespace App\Leads\Jobs;

use App\Leads\Enums\CallStatus;
use App\Leads\Models\LeadCall;
use App\Leads\Notifications\MissedCallNotification;
use App\Leads\Services\LeadPeople;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Missed-call bell alert to every manager and the mother admin, once per
 * call per person.
 */
class SendMissedCallNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public string $callId) {}

    public function handle(LeadPeople $people): void
    {
        $call = LeadCall::query()->with('lead')->find($this->callId);

        if ($call === null || $call->status !== CallStatus::Missed || $call->lead === null) {
            return;
        }

        foreach ($people->managers() as $manager) {
            $already = $manager->notifications()
                ->where('type', MissedCallNotification::class)
                ->where('data', 'like', '%"call_id":"'.$call->id.'"%')
                ->exists();

            if (! $already) {
                $manager->notify(new MissedCallNotification($call, $call->lead->name));
            }
        }
    }
}
