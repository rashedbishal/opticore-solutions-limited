<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Calling\CreateCallPermissionTemplate;
use App\Leads\Calling\SoftphonePresence;
use App\Leads\Enums\CallStatus;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadCall;
use App\Leads\Models\LeadSource;
use App\Leads\Services\LeadPeople;
use App\Models\Admin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Leads → Calling (managers and the mother admin): who is a backup call
 * receiver, and whose call box is open right now.
 */
class CallingController extends Controller
{
    public function index(LeadPeople $people, SoftphonePresence $presence): Response
    {
        $this->manager();
        $busy = LeadCall::query()->whereIn('status', [CallStatus::Answering, CallStatus::Connected])->pluck('claimed_by')->map(fn ($id): int => (int) $id)->all();

        return Inertia::render('Admin/Leads/Calling', [
            'people' => $people->leadUsersQuery()->orderBy('name')->get()->toBase()->map(fn (Admin $a): array => [
                'id' => (int) $a->id,
                'name' => $a->name,
                'role' => $a->isMotherAdmin() ? 'Mother admin' : ($a->lead_role?->label() ?? ''),
                'is_backup' => $a->is_whatsapp_backup_receiver,
                'online' => $presence->isAvailable($a),
                'on_call' => in_array((int) $a->id, $busy, true),
            ])->values(),
            'numbers' => LeadSource::query()->where('type', LeadSourceType::Whatsapp->value)->orderBy('name')->get()->toBase()->map(fn (LeadSource $s): array => [
                'id' => $s->id,
                'name' => $s->name,
                'calling_enabled' => $s->calling_enabled,
                'template_name' => CreateCallPermissionTemplate::nameFor($s),
                'template_status' => is_array($s->config) ? ($s->config[CreateCallPermissionTemplate::CREATED_KEY] ?? null) : null,
                'has_waba' => is_array($s->config) && ! empty($s->config['whatsapp_business_account_id']),
            ])->values(),
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

    public function createTemplate(LeadSource $source, CreateCallPermissionTemplate $create): RedirectResponse
    {
        $this->manager();
        $result = $create->handle($source);

        return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
    }

    private function manager(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->isLeadManager(), 403);

        return $admin;
    }
}
