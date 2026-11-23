<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Calling\SoftphonePresence;
use App\Leads\Enums\CallStatus;
use App\Leads\Models\LeadCall;
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

    private function manager(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->isLeadManager(), 403);

        return $admin;
    }
}
