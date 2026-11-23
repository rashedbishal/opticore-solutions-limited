<?php

namespace App\Leads\Calling;

use App\Leads\Enums\CallingApiError;
use App\Leads\Enums\LeadCallPermissionStatus;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadCallPermission;
use App\Leads\Models\LeadSource;
use App\Models\Admin;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * A lead's WhatsApp call permission, as in OptiFin: always read live from
 * Meta before asking or dialling (never trusted from our copy), updated by
 * the lead's own Allow / Don't allow reply, and an older observation never
 * overwrites a newer one.
 */
class CallPermissions
{
    /** Who may call or ask: the lead's own person, and managers. */
    public function canCall(Admin $admin, Lead $lead): bool
    {
        return $admin->isLeadManager() || ($admin->isLeadAgent() && $lead->assigned_to === (int) $admin->id);
    }

    /** The WhatsApp number to call the lead from, if any. */
    public function sourceFor(Lead $lead): ?LeadSource
    {
        $viaChat = $lead->conversations()
            ->whereHas('leadSource', fn ($q) => $q->where('type', LeadSourceType::Whatsapp->value))
            ->with('leadSource')
            ->latest('last_inbound_at')
            ->first()?->leadSource;

        if ($viaChat instanceof LeadSource) {
            return $viaChat;
        }

        $lead->loadMissing('source');

        return $lead->source->type === LeadSourceType::Whatsapp ? $lead->source : null;
    }

    /** The lead's WhatsApp id (digits only), if they have a phone. */
    public function waId(Lead $lead): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $lead->phone);

        return is_string($digits) && strlen($digits) >= 7 ? $digits : null;
    }

    public function check(Lead $lead, LeadSource $source): CallingApiResult
    {
        $observedAt = Carbon::now();
        $waId = $this->waId($lead);

        if ($waId === null) {
            return CallingApiResult::failure(CallingApiError::Validation, null, null);
        }

        $result = (new WhatsAppCallingClient($source))->checkCallPermission($waId);

        if ($result->successful) {
            $status = $result->data['status'] ?? null;
            $expiration = $result->data['expiration_time'] ?? null;

            $this->write($lead, $source, $observedAt, [
                'status' => match ($status) {
                    'temporary' => LeadCallPermissionStatus::Temporary,
                    'permanent' => LeadCallPermissionStatus::Permanent,
                    default => $this->keepRequested($lead),
                },
                'meta_raw_status' => is_string($status) ? $status : null,
                'expires_at' => $status === 'temporary' && is_int($expiration) ? Carbon::createFromTimestamp($expiration) : null,
                'last_synced_at' => $observedAt,
            ]);
        }

        return $result;
    }

    /**
     * Sends the "may we call you?" message — only when Meta says we may ask
     * right now.
     *
     * @return array{ok: bool, message: string}
     */
    public function request(Lead $lead, LeadSource $source): array
    {
        $check = $this->check($lead, $source);

        if (! $check->successful) {
            return ['ok' => false, 'message' => $check->userMessage() ?: 'Could not check the permission with WhatsApp.'];
        }

        if (($check->data['actions']['send_call_permission_request'] ?? false) !== true) {
            return ['ok' => false, 'message' => 'WhatsApp won\'t let us ask this person right now (they may already have been asked recently, or already allow calls).'];
        }

        $config = is_array($source->config) ? $source->config : [];
        $template = (array) config('calling.call_permission_request_template');

        try {
            $response = Http::withToken((string) ($config['access_token'] ?? ''))
                ->timeout((int) config('calling.api_timeout_seconds'))
                ->connectTimeout((int) config('calling.api_connect_timeout_seconds'))
                ->asJson()
                ->post(sprintf('https://graph.facebook.com/%s/%s/messages', config('calling.graph_version'), rawurlencode((string) ($config['phone_number_id'] ?? ''))), [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $this->waId($lead),
                    'type' => 'template',
                    'template' => [
                        'name' => CreateCallPermissionTemplate::nameFor($source),
                        'language' => ['code' => $template['language'] ?? 'en'],
                        'components' => [['type' => 'call_permission_request']],
                    ],
                ]);
        } catch (Throwable $e) {
            Log::warning('WA CALL PERMISSION REQUEST FAILED', ['lead_source_id' => $source->id, 'exception' => $e::class]);

            return ['ok' => false, 'message' => 'Could not reach WhatsApp. Try again in a few minutes.'];
        }

        if (! $response->successful()) {
            $message = $response->json('error.error_user_msg') ?? $response->json('error.message');

            return ['ok' => false, 'message' => is_string($message) ? "WhatsApp refused the message: {$message}" : 'WhatsApp refused the message. Is the permission message approved yet?'];
        }

        $now = Carbon::now();
        $this->write($lead, $source, $now, ['status' => LeadCallPermissionStatus::Requested, 'last_requested_at' => $now]);

        return ['ok' => true, 'message' => 'Permission request sent. The lead will see an "Allow calls" button in WhatsApp.'];
    }

    /** The lead tapped Allow / Don't allow in WhatsApp. */
    public function recordReply(Lead $lead, LeadSource $source, string $response, bool $permanent, ?int $expiration, Carbon $observedAt): void
    {
        $status = $response !== 'accept'
            ? LeadCallPermissionStatus::Rejected
            : ($permanent ? LeadCallPermissionStatus::Permanent : LeadCallPermissionStatus::Temporary);

        $this->write($lead, $source, $observedAt, [
            'status' => $status,
            'meta_raw_status' => null,
            'expires_at' => $status === LeadCallPermissionStatus::Temporary && $expiration !== null ? Carbon::createFromTimestamp($expiration) : null,
            'last_synced_at' => $observedAt,
        ]);
    }

    /**
     * Meta says "no permission" both before and after asking; keep showing
     * "Asked" while our request is still the latest thing that happened.
     */
    private function keepRequested(Lead $lead): LeadCallPermissionStatus
    {
        $current = LeadCallPermission::query()->where('lead_id', $lead->id)->value('status');

        return in_array($current, [LeadCallPermissionStatus::Requested->value, LeadCallPermissionStatus::Rejected->value], true)
            ? LeadCallPermissionStatus::from($current)
            : LeadCallPermissionStatus::NoPermission;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function write(Lead $lead, LeadSource $source, Carbon $observedAt, array $attributes): void
    {
        $existing = LeadCallPermission::query()->where('lead_id', $lead->id)->first();

        if ($existing === null) {
            try {
                LeadCallPermission::query()->create(['lead_id' => $lead->id, 'lead_source_id' => $source->id, ...$attributes]);

                return;
            } catch (UniqueConstraintViolationException) {
                $existing = LeadCallPermission::query()->where('lead_id', $lead->id)->first();

                if ($existing === null) {
                    return;
                }
            }
        }

        $values = ['lead_source_id' => $source->id, ...$attributes, 'updated_at' => Carbon::now()];

        if (($values['status'] ?? null) instanceof LeadCallPermissionStatus) {
            $values['status'] = $values['status']->value;
        }

        LeadCallPermission::query()
            ->whereKey($existing->id)
            ->where(fn ($q) => $q->whereNull('last_synced_at')->orWhere('last_synced_at', '<=', $observedAt))
            ->update($values);
    }
}
