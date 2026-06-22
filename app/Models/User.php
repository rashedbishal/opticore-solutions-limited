<?php

namespace App\Models;

use App\Events\PromotionalEmailPreferenceUpdated;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

// 'role' is deliberately excluded — it must only ever be set directly, never
// through mass assignment, so no future request-driven update path can let a
// user grant themselves admin.
#[Fillable(['name', 'email', 'phone_number', 'address', 'country', 'password', 'google_id', 'facebook_id', 'avatar', 'notify_order_updates', 'notify_security_alerts', 'notify_promotional_emails'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'notify_order_updates' => 'boolean',
            'notify_security_alerts' => 'boolean',
            'notify_promotional_emails' => 'boolean',
        ];
    }

    /**
     * Self-deletion rewrites `email` to an unreachable placeholder (to free
     * the address for reuse) and stashes the real one in `original_email`.
     * Reading it back transparently as `original_email` once the account is
     * trashed means every CMS view that displays `$user->email` keeps
     * showing the client's real address, not the placeholder, without each
     * call site needing to know about this swap.
     */
    protected function email(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => $this->trashed() && $this->original_email
                ? $this->original_email
                : $value,
        );
    }

    /**
     * Keep the subscriptions mailing list in sync whenever the promotional
     * emails preference changes, and broadcast the change so any other open
     * tab/device reflects it instantly.
     */
    protected static function booted(): void
    {
        static::updated(function (User $user): void {
            if (! $user->wasChanged('notify_promotional_emails')) {
                return;
            }

            if ($user->notify_promotional_emails) {
                Subscription::firstOrCreate(['email' => $user->email]);
            } else {
                Subscription::where('email', $user->email)->first()?->delete();
            }

            broadcast(new PromotionalEmailPreferenceUpdated($user->id));
        });
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function conversation()
    {
        return $this->hasOne(Conversation::class);
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}
