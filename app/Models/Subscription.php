<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['email'])]
class Subscription extends Model
{
    /**
     * Mirror the subscriber list onto a matching registered user's
     * "Promotional Emails" preference, regardless of whether the row was
     * added/removed via the public footer form or the admin panel.
     */
    protected static function booted(): void
    {
        static::created(function (Subscription $subscription): void {
            $user = User::where('email', $subscription->email)->first();

            if ($user && ! $user->notify_promotional_emails) {
                $user->update(['notify_promotional_emails' => true]);
            }
        });

        static::deleted(function (Subscription $subscription): void {
            $user = User::where('email', $subscription->email)->first();

            if ($user && $user->notify_promotional_emails) {
                $user->update(['notify_promotional_emails' => false]);
            }
        });
    }
}
