<?php

namespace App\Events;

use App\Models\Offer;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OfferStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Offer $offer) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversations.'.$this->offer->conversation_id),
            new PrivateChannel('admin.conversations'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'offer_id' => $this->offer->id,
            'status' => $this->offer->status,
            'conversation_id' => $this->offer->conversation_id,
        ];
    }
}
