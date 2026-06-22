<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'last_message',
        'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    /**
     * Include soft-deleted users so a conversation's name/email still
     * render after the client deletes their own account — otherwise this
     * relation silently resolves to null and crashes every frontend view
     * that reads `conversation.user.*` without a guard (admin chat list,
     * offer edit page, etc.).
     */
    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function offers()
    {
        return $this->hasMany(Offer::class);
    }
}
