<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The connection name for the model.
     *
     * @var string|null
     */
    protected $connection = 'admin';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'full_access',
        'permissions',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

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
            'is_super_admin' => 'boolean',
            'full_access' => 'boolean',
            'permissions' => 'array',
        ];
    }

    /**
     * Determine whether this admin is the single, immutable "mother admin"
     * account that always has full access and can manage other admins.
     */
    public function isMotherAdmin(): bool
    {
        return $this->is_super_admin;
    }

    /**
     * Get the single, immutable "mother admin" account, used as the master
     * key for password-gated destructive actions regardless of who is
     * currently logged in.
     */
    public static function motherAdmin(): ?self
    {
        return static::where('is_super_admin', true)->first();
    }

    /**
     * Determine whether this admin can access the CMS section identified
     * by the given permission key. Dashboard is intentionally not gated
     * here — callers treat it as always-allowed.
     */
    public function canAccess(string $key): bool
    {
        if ($this->is_super_admin || $this->full_access) {
            return true;
        }

        return in_array($key, $this->permissions ?? [], true);
    }

    /**
     * A fingerprint of this admin's authentication-relevant state (password,
     * role, and permissions). Sessions store this value at login and compare
     * it on every request — a mismatch means someone changed the account
     * since the session started, so the session is invalidated.
     */
    public function securityStamp(): string
    {
        return hash('sha256', implode('|', [
            $this->password,
            $this->is_super_admin ? '1' : '0',
            $this->full_access ? '1' : '0',
            json_encode($this->permissions ?? []),
        ]));
    }
}
