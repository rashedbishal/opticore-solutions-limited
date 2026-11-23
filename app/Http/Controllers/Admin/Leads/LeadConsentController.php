<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Actions\RecordLeadConsent;
use App\Leads\Enums\ConsentSource;
use App\Leads\Enums\ConsentStatus;
use App\Leads\Enums\ConsentType;
use App\Leads\Models\Lead;
use App\Leads\Services\LeadAccess;
use App\Models\Admin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Grant / Withdraw on the lead's Consent card (anyone who can work the lead).
 */
class LeadConsentController extends Controller
{
    public function update(Lead $lead, string $type, string $status, LeadAccess $access, RecordLeadConsent $record): RedirectResponse
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($access->canUpdate($admin, $lead), 403);

        $consentType = ConsentType::tryFrom($type) ?? abort(404);
        $consentStatus = ConsentStatus::tryFrom($status) ?? abort(404);

        $record->handle($lead, $consentType, $consentStatus, ConsentSource::Manual, $admin);

        return back()->with('success', $consentType->label().($consentStatus === ConsentStatus::Granted ? ' granted.' : ' withdrawn.'));
    }
}
