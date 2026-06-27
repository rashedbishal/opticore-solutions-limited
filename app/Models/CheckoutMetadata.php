<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CheckoutMetadata extends Model
{
    protected $fillable = [
        'upload_token',
        'transaction_id',
        'user_id',
        'notes',
        'attachment_paths',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'attachment_paths' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
