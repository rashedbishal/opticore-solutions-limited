<?php

namespace App\Leads\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * A call changed. Sent at once (not queued — ringing can't wait) to each
 * ringing person's own channel; carries only the call id and status, and
 * the call box refetches the details.
 */
class LeadCallUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    /**
     * @param  array<int, int>  $recipientIds
     */
    public function __construct(public string $callId, public string $status, public array $recipientIds) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return array_map(fn (int $id): PrivateChannel => new PrivateChannel("admin.lead-calls.{$id}"), $this->recipientIds);
    }

    public function broadcastAs(): string
    {
        return 'call.updated';
    }

    /**
     * @return array{id: string, status: string}
     */
    public function broadcastWith(): array
    {
        return ['id' => $this->callId, 'status' => $this->status];
    }
}
