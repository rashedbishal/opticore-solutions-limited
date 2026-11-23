<?php

namespace App\Http\Controllers\Admin\LeadSettings;

use App\Http\Controllers\Controller;
use App\Leads\Enums\AutoDistributionMethod;
use App\Leads\Enums\LeadDistributionMode;
use App\Leads\Models\LeadSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Lead Settings → General (mother admin only): how new leads are handed
 * out, the lead number prefix, and meeting / follow-up reminders.
 */
class GeneralController extends Controller
{
    public function edit(): Response
    {
        $settings = LeadSetting::current();

        return Inertia::render('Admin/LeadSettings/General', [
            'settings' => [
                'distribution_mode' => $settings->distribution_mode->value,
                'auto_distribution_method' => $settings->auto_distribution_method?->value,
                'lead_id_prefix' => $settings->lead_id_prefix,
                'next_lead_number' => $settings->next_lead_number,
                'meeting_alert_enabled' => $settings->meeting_alert_enabled,
                'meeting_alert_days_before' => $settings->meeting_alert_days_before,
                'followup_alert_enabled' => $settings->followup_alert_enabled,
                'followup_alert_days_before' => $settings->followup_alert_days_before,
                'task_alert_enabled' => $settings->task_alert_enabled,
                'task_alert_days_before' => $settings->task_alert_days_before,
            ],
            'methodOptions' => array_map(
                fn (AutoDistributionMethod $method): array => ['value' => $method->value, 'label' => $method->label()],
                AutoDistributionMethod::cases(),
            ),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'distribution_mode' => ['required', Rule::enum(LeadDistributionMode::class)],
            'auto_distribution_method' => ['nullable', 'required_if:distribution_mode,automatic', Rule::enum(AutoDistributionMethod::class)],
            'lead_id_prefix' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z0-9-]+$/'],
            'meeting_alert_enabled' => ['required', 'boolean'],
            'meeting_alert_days_before' => ['required', 'integer', 'min:0', 'max:365'],
            'followup_alert_enabled' => ['required', 'boolean'],
            'followup_alert_days_before' => ['required', 'integer', 'min:0', 'max:365'],
            'task_alert_enabled' => ['required', 'boolean'],
            'task_alert_days_before' => ['required', 'integer', 'min:0', 'max:365'],
        ], [
            'auto_distribution_method.required_if' => 'Choose how leads are shared out automatically.',
            'lead_id_prefix.regex' => 'The prefix may only contain letters, numbers and hyphens.',
        ]);

        LeadSetting::current()->update([
            ...$validated,
            'lead_id_prefix' => strtoupper($validated['lead_id_prefix']),
            'auto_distribution_method' => $validated['distribution_mode'] === LeadDistributionMode::Automatic->value
                ? $validated['auto_distribution_method']
                : null,
        ]);

        return back()->with('success', 'Lead settings saved.');
    }
}
