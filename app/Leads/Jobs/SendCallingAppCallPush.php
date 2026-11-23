<?php

namespace App\Leads\Jobs;

use App\Leads\CallingApp\CallingAppCallPush;
use App\Leads\CallingApp\CallingAppDevice;
use App\Leads\CallingApp\CallingAppFirebase;
use App\Leads\Enums\CallDirection;
use App\Leads\Enums\CallStatus;
use App\Leads\Models\LeadCall;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Notifications\ChannelManager;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;

/**
 * Rings the connected phones of the people a call rings for, through
 * Firebase, and later tells them to stop (same as OptiFin). The phone that
 * answered doesn't get the "stop".
 */
class SendCallingAppCallPush implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(public string $callId, public bool $ended) {}

    public function handle(CallingAppFirebase $firebase): void
    {
        if (! $firebase->isConfigured()) {
            return;
        }

        $call = LeadCall::query()->with('lead')->find($this->callId);

        if ($call === null || $call->direction !== CallDirection::Inbound || $call->lead === null) {
            return;
        }

        // A key changed in the CMS must be used even by a long-running worker.
        if (! Notification::isFake()) {
            app(ChannelManager::class)->forgetDrivers();
        }

        if (! $this->ended) {
            $left = $call->ringing_expires_at === null ? 0 : (int) Carbon::now()->diffInSeconds($call->ringing_expires_at, false);

            if ($call->status !== CallStatus::Ringing || $left <= 0) {
                return;
            }

            $push = CallingAppCallPush::incomingCall($call->id, $call->lead->name, $call->lead->phone, $left);
            $this->devices($call)->each(fn (CallingAppDevice $d) => $d->notify($push));

            return;
        }

        if ($call->status === CallStatus::Ringing) {
            return;
        }

        $push = CallingAppCallPush::callEnded($call->id);
        $this->devices($call)
            ->reject(fn (CallingAppDevice $d) => $d->admin_id === $call->claimed_by)
            ->each(fn (CallingAppDevice $d) => $d->notify($push));
    }

    /**
     * @return Collection<int, CallingAppDevice>
     */
    private function devices(LeadCall $call): Collection
    {
        return CallingAppDevice::query()
            ->whereIn('admin_id', array_map('intval', $call->routed_user_ids ?? []))
            ->whereNotNull('fcm_token')
            ->get();
    }
}
