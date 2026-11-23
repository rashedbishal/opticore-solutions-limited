<?php

namespace App\Leads\Actions;

use App\Leads\Enums\LeadPriority;
use App\Leads\Enums\WebsiteFormFixedField;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadStatus;
use App\Leads\Models\WebsiteForm;
use App\Leads\Services\LeadIntake;
use App\Leads\Support\LeadRules;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * Turns one website form submission into a lead (same rules as OptiFin):
 * a filled-in hidden "_gotcha" field marks a spam bot and is silently
 * accepted without a lead; the same submission twice within 20 seconds
 * (double click) creates only one lead.
 */
class SubmitWebsiteForm
{
    public const HONEYPOT_FIELD = '_gotcha';

    public function __construct(private readonly LeadIntake $intake) {}

    /**
     * @param  array<string, mixed>  $payload
     *
     * @throws ValidationException
     */
    public function handle(WebsiteForm $form, array $payload): ?Lead
    {
        if (trim((string) ($payload[self::HONEYPOT_FIELD] ?? '')) !== '') {
            return null;
        }

        $rules = ['name' => LeadRules::contact()['name']];
        $input = ['name' => $payload['name'] ?? null];

        foreach ($form->fields as $field) {
            $fixed = WebsiteFormFixedField::tryFrom((string) $field->fixed_field);

            if ($fixed === null) {
                continue;
            }

            $rules[$fixed->value] = match ($fixed) {
                WebsiteFormFixedField::Email => ['nullable', 'email', 'max:255'],
                WebsiteFormFixedField::Phone => LeadRules::contact()['phone'],
                WebsiteFormFixedField::Message => ['nullable', 'string', 'max:2000'],
            };
            $input[$fixed->value] = $payload[$fixed->value] ?? null;
        }

        $validated = Validator::make($input, $rules, LeadRules::messages())->validate();

        $attributes = [
            'name' => $validated['name'],
            'email' => ($validated['email'] ?? null) ?: null,
            'phone' => ($validated['phone'] ?? null) ?: null,
            'message' => ($validated['message'] ?? null) ?: null,
        ];

        $fingerprint = hash('sha256', json_encode([...$attributes, 'email' => is_string($attributes['email']) ? mb_strtolower($attributes['email']) : null]) ?: '');
        $marker = "website-form-submission:{$form->id}:{$fingerprint}";

        $create = function () use ($form, $attributes): Lead {
            $lead = DB::transaction(fn (): Lead => Lead::create([
                ...$attributes,
                'source_id' => $form->lead_source_id,
                'status_id' => LeadStatus::initial()?->id,
                'priority' => LeadPriority::Medium,
                'source_data' => ['website_form_id' => $form->id, 'website_form_name' => $form->name],
            ]));

            $form->leadSource->update(['last_synced_at' => now()]);
            $this->intake->received($lead);

            return $lead;
        };

        try {
            return Cache::lock("{$marker}:lock", 10)->block(5, function () use ($marker, $create): ?Lead {
                if (Cache::has($marker)) {
                    return null;
                }

                $lead = $create();
                Cache::put($marker, true, now()->addSeconds(20));

                return $lead;
            });
        } catch (LockTimeoutException) {
            return $create();
        }
    }
}
