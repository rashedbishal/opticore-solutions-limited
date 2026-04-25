<?php

namespace App\Events;

use App\Models\Offer;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OfferUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Offer $offer)
    {
        $this->offer->load(['subCategory', 'milestones', 'conversation.user']);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversations.'.$this->offer->conversation_id),
            new PrivateChannel('admin.conversations'),
        ];
    }

    public function broadcastWith(): array
    {
        return ['offer' => $this->offer->toArray()];
    }
}
