<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Calling\CreateCallPermissionTemplate;
use App\Leads\Calling\SoftphonePresence;
use App\Leads\CallingApp\CallingAppDevice;
use App\Leads\Enums\CallStatus;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadCall;
use App\Leads\Models\LeadSetting;
use App\Leads\Models\LeadSource;
use App\Leads\Services\LeadPeople;
use App\Models\Admin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Leads → Calling (managers and the mother admin): who is a backup call
 * receiver, and whose call box is open right now.
 */
class CallingController extends Controller
{
    public function index(LeadPeople $people, SoftphonePresence $presence): Response
    {
        $this->manager();
        $devices = CallingAppDevice::query()->get()->keyBy('admin_id');
        $busy = LeadCall::query()->whereIn('status', [CallStatus::Answering, CallStatus::Connected])->pluck('claimed_by')->map(fn ($id): int => (int) $id)->all();

        return Inertia::render('Admin/Leads/Calling', [
            'people' => $people->leadUsersQuery()->orderBy('name')->get()->toBase()->map(fn (Admin $a): array => [
                'id' => (int) $a->id,
                'name' => $a->name,
                'role' => $a->isMotherAdmin() ? 'Mother admin' : ($a->lead_role?->label() ?? ''),
                'is_backup' => $a->is_whatsapp_backup_receiver,
                'online' => $presence->isAvailable($a),
                'on_call' => in_array((int) $a->id, $busy, true),
                'phone' => $devices->has((int) $a->id) ? ($devices[(int) $a->id]->device_name ?? 'Phone') : null,
            ])->values(),
            'numbers' => LeadSource::query()->where('type', LeadSourceType::Whatsapp->value)->orderBy('name')->get()->toBase()->map(fn (LeadSource $s): array => [
                'id' => $s->id,
                'name' => $s->name,
                'calling_enabled' => $s->calling_enabled,
                'template_name' => CreateCallPermissionTemplate::nameFor($s),
                'template_status' => is_array($s->config) ? ($s->config[CreateCallPermissionTemplate::CREATED_KEY] ?? null) : null,
                'has_waba' => is_array($s->config) && ! empty($s->config['whatsapp_business_account_id']),
            ])->values(),
            'ringtone' => LeadSetting::current()->ringtone_name,
        ]);
    }

    public function toggleBackup(int $admin, LeadPeople $people): RedirectResponse
    {
        $this->manager();
        $person = $people->findLeadUser($admin);
        abort_if($person === null, 404);

        $person->forceFill(['is_whatsapp_backup_receiver' => ! $person->is_whatsapp_backup_receiver])->save();

        return back()->with('success', $person->is_whatsapp_backup_receiver
            ? "{$person->name} is now a backup call receiver."
            : "{$person->name} is no longer a backup call receiver.");
    }

    /** Managers: disconnect someone's phone app. */
    public function disconnectPhone(int $admin): RedirectResponse
    {
        $this->manager();
        CallingAppDevice::query()->where('admin_id', $admin)->get()->each->disconnect();

        return back()->with('success', 'Phone disconnected.');
    }

    public function createTemplate(LeadSource $source, CreateCallPermissionTemplate $create): RedirectResponse
    {
        $this->manager();
        $result = $create->handle($source);

        return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
    }

    /** A shared MP3 that rings instead of the built-in tone. */
    public function uploadRingtone(Request $request): RedirectResponse
    {
        $this->manager();
        $request->validate(['ringtone' => ['required', 'file', 'mimes:mp3,mpga', 'max:1024']], [
            'ringtone.mimes' => 'Please upload an MP3 file.',
            'ringtone.max' => 'The ringtone must be 1 MB or smaller.',
        ]);

        $file = $request->file('ringtone');
        abort_if($file === null || is_array($file), 422);

        $settings = LeadSetting::current();
        $old = $settings->ringtone_path;
        $path = $file->storeAs('leads/ringtone', Str::ulid().'.mp3', 'local');

        if ($path === false) {
            return back()->with('error', 'The ringtone could not be saved.');
        }

        $settings->update(['ringtone_path' => $path, 'ringtone_name' => mb_substr($file->getClientOriginalName(), 0, 255)]);

        if ($old !== null) {
            Storage::disk('local')->delete($old);
        }

        return back()->with('success', 'Ringtone uploaded. Call boxes pick it up within a few seconds.');
    }

    public function removeRingtone(): RedirectResponse
    {
        $this->manager();
        $settings = LeadSetting::current();

        if ($settings->ringtone_path !== null) {
            Storage::disk('local')->delete($settings->ringtone_path);
        }

        $settings->update(['ringtone_path' => null, 'ringtone_name' => null]);

        return back()->with('success', 'Back to the built-in ringtone.');
    }

    /** Streamed to anyone with a lead role (the file is private). */
    public function ringtone(): StreamedResponse
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->canUseLeads(), 403);
        $path = LeadSetting::current()->ringtone_path;
        abort_if($path === null || ! Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path, 'ringtone.mp3', ['Content-Type' => 'audio/mpeg', 'Cache-Control' => 'private, max-age=86400']);
    }

    private function manager(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->isLeadManager(), 403);

        return $admin;
    }
}
