<?php

namespace App\Models;

use App\Leads\Enums\LeadRole;
use App\Leads\Models\AdminNotification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property LeadRole|null $lead_role Lead Management role chosen by the mother admin.
 * @property bool $is_whatsapp_backup_receiver Rings for calls the lead's own person can't take.
 * @property Carbon|null $softphone_last_seen_at Last check-in from an open call box.
 */
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
        'lead_role',
        'is_whatsapp_backup_receiver',
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
            'lead_role' => LeadRole::class,
            'is_whatsapp_backup_receiver' => 'boolean',
            'softphone_last_seen_at' => 'datetime',
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
     * True only for a regular admin whose sole granted permission is
     * 'meal-management' — used to keep such admins off the dashboard
     * entirely and land them straight in the meal-management section
     * instead. Never true for the mother admin or a full_access admin,
     * since both can already reach every section including the dashboard.
     */
    public function isMealManagementOnly(): bool
    {
        if ($this->is_super_admin || $this->full_access || $this->lead_role !== null) {
            return false;
        }

        $permissions = $this->permissions ?? [];

        return count($permissions) === 1 && $permissions[0] === 'meal-management';
    }

    /**
     * A fingerprint of this admin's authentication-relevant state (password,
     * role, and permissions). Sessions store this value at login and compare
     * it on every request — a mismatch means someone changed the account
     * since the session started, so the session is invalidated.
     */
    public function securityStamp(): string
    {
        $parts = [
            $this->password,
            $this->is_super_admin ? '1' : '0',
            $this->full_access ? '1' : '0',
            json_encode($this->permissions ?? []),
        ];

        // Appended only when set, so admins without a lead role keep the
        // exact stamp they had before lead roles existed (no mass logout).
        if ($this->lead_role !== null) {
            $parts[] = 'lead:'.$this->lead_role->value;
        }

        return hash('sha256', implode('|', $parts));
    }

    /**
     * The admin's effective Lead Management role. The mother admin is always
     * a Manager; everyone else has exactly the role the mother admin gave
     * them. `full_access` deliberately grants nothing here.
     */
    public function leadRole(): ?LeadRole
    {
        return $this->isMotherAdmin() ? LeadRole::Manager : $this->lead_role;
    }

    public function canUseLeads(): bool
    {
        return $this->leadRole() !== null;
    }

    public function isLeadManager(): bool
    {
        return $this->leadRole() === LeadRole::Manager;
    }

    public function isLeadAgent(): bool
    {
        return $this->leadRole() === LeadRole::Agent;
    }

    /**
     * Lead alerts live in the main database (see AdminNotification), not on
     * this model's `admin` connection.
     *
     * @return MorphMany<AdminNotification, $this>
     */
    public function notifications(): MorphMany
    {
        return $this->morphMany(AdminNotification::class, 'notifiable')->latest();
    }
}
