<?php

namespace App\Leads\CallingApp;

use App\Models\Admin;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * The phone an admin connected to the calling app (one per admin). The app
 * signs in with a Sanctum token that can only be used by the app.
 *
 * @property int $admin_id
 * @property int|null $personal_access_token_id
 * @property string|null $device_name
 * @property string|null $browser_marker_hash
 * @property string|null $fcm_token
 * @property Carbon|null $last_seen_at
 */
class CallingAppDevice extends Model
{
    use HasUlids, Notifiable;

    public const string TOKEN_ABILITY = 'calling-app';

    protected $fillable = ['admin_id', 'personal_access_token_id', 'device_name', 'browser_marker_hash', 'fcm_token', 'fcm_token_updated_at', 'last_seen_at'];

    protected function casts(): array
    {
        return [
            'admin_id' => 'integer',
            'personal_access_token_id' => 'integer',
            'fcm_token_updated_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    public function routeNotificationForFcm(): ?string
    {
        return $this->fcm_token;
    }

    public function admin(): ?Admin
    {
        return Admin::query()->find($this->admin_id);
    }

    /** Disconnect: the device row and its app token both go. */
    public function disconnect(): void
    {
        if ($this->personal_access_token_id !== null) {
            CallingAppToken::query()->whereKey($this->personal_access_token_id)->delete();
        }

        $this->delete();
    }
}
