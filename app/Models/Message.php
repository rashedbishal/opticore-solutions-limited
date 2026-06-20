<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_type',
        'sender_id',
        'message',
        'attachment_path',
        'attachment_type',
        'delivered_at',
        'read_at',
        'offer_id',
    ];

    protected function casts(): array
    {
        return [
            'delivered_at' => 'datetime',
            'read_at' => 'datetime',
        ];
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }
}
