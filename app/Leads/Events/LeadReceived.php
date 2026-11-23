<?php

namespace App\Leads\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * A new lead arrived (fires exactly once, on creation). Tells open lead
 * pages to refresh. Carries only the lead id: each viewer
 * refetches from the server, which applies their own visibility rules.
 */
class LeadReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public string $leadId) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin.leads')];
    }

    public function broadcastAs(): string
    {
        return 'lead.received';
    }

    /**
     * @return array{id: string}
     */
    public function broadcastWith(): array
    {
        return ['id' => $this->leadId];
    }
}
