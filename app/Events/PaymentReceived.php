<?php

namespace App\Events;

use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentReceived implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Transaction $transaction)
    {
        $this->transaction->load('subCategory');
    }

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.transactions'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $categories = Category::configShape();

        return [
            'name' => $this->transaction->name,
            'amount' => $this->transaction->amount,
            'currency' => $this->transaction->currency,
            'service' => $this->transaction->subCategory?->name
                ?? $categories[$this->transaction->category]['label'] ?? null,
        ];
    }
}
