<?php

namespace App\Leads\Calling;

use App\Leads\Enums\CallingApiError;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;
use Illuminate\Support\Carbon;

/**
 * Turn Meta's calling on/off for one WhatsApp number, or check it (mother
 * admin). "On here" (our intent) and "what Meta last said" are kept apart,
 * and an older check never overwrites a newer one.
 *
 * @phpstan-type Outcome array{level: 'success'|'warning'|'danger', message: string}
 */
class ManageWhatsAppCalling
{
    public function blockedReason(LeadSource $source): ?string
    {
        if ($source->type !== LeadSourceType::Whatsapp) {
            return 'Calling only works on WhatsApp numbers.';
        }

        if (! $source->is_active) {
            return 'Turn this source on before turning calling on.';
        }

        $config = is_array($source->config) ? $source->config : [];

        foreach (['app_secret' => 'App Secret', 'phone_number_id' => 'Phone Number ID', 'access_token' => 'Access Token'] as $key => $label) {
            if (! is_string($config[$key] ?? null) || $config[$key] === '') {
                return "Add the {$label} to this source before turning calling on.";
            }
        }

        return null;
    }

    /**
     * @return Outcome
     */
    public function enable(LeadSource $source): array
    {
        if (($reason = $this->blockedReason($source)) !== null) {
            return ['level' => 'danger', 'message' => $reason];
        }

        $client = new WhatsAppCallingClient($source);
        $post = $client->setCallingStatus(true);

        if (! $post->successful) {
            return ['level' => 'danger', 'message' => $post->error === CallingApiError::Network
                ? $post->userMessage().' The request may or may not have reached WhatsApp — press Check.'
                : $post->userMessage()];
        }

        $observedAt = Carbon::now();
        $get = $client->getSettings();

        if (! $get->successful) {
            return ['level' => 'warning', 'message' => 'WhatsApp did not confirm calling is on. Press Check in a minute.'];
        }

        $status = $this->status($get);

        if ($status !== 'ENABLED') {
            if ($status !== null) {
                $this->observe($source, $status, $observedAt);
            }

            return ['level' => 'warning', 'message' => 'WhatsApp did not confirm calling is on. Press Check in a minute.'];
        }

        return $this->observe($source, 'ENABLED', $observedAt, ['calling_enabled' => true])
            ? ['level' => 'success', 'message' => 'Calling is now on for this WhatsApp number.']
            : ['level' => 'warning', 'message' => 'Another change happened at the same time, so nothing was turned on. Press Check.'];
    }

    /**
     * Turns it off here first, so calls stop ringing even if Meta can't be
     * reached.
     *
     * @return Outcome
     */
    public function disable(LeadSource $source): array
    {
        LeadSource::query()->whereKey($source->id)->update(['calling_enabled' => false]);

        $post = (new WhatsAppCallingClient($source))->setCallingStatus(false);

        if (! $post->successful) {
            return ['level' => 'warning', 'message' => "Calling is off here, but WhatsApp couldn't be updated: {$post->userMessage()} Press Check to see whether it's still on there."];
        }

        $this->observe($source, 'DISABLED', Carbon::now());

        return ['level' => 'success', 'message' => 'Calling is now off for this WhatsApp number.'];
    }

    /**
     * @return Outcome
     */
    public function check(LeadSource $source): array
    {
        $observedAt = Carbon::now();
        $get = (new WhatsAppCallingClient($source))->getSettings();

        if (! $get->successful) {
            return ['level' => 'danger', 'message' => $get->userMessage()];
        }

        $status = $this->status($get);

        if ($status === null) {
            return ['level' => 'warning', 'message' => 'WhatsApp did not report a calling status for this number.'];
        }

        $this->observe($source, $status, $observedAt);
        $metaOn = $status === 'ENABLED';
        $fresh = $source->fresh();
        $here = $fresh !== null && $fresh->calling_enabled;

        return match (true) {
            $metaOn && $here => ['level' => 'success', 'message' => 'Calling is on at WhatsApp, matching the CMS.'],
            ! $metaOn && ! $here => ['level' => 'success', 'message' => 'Calling is off at WhatsApp, matching the CMS.'],
            $metaOn => ['level' => 'warning', 'message' => 'Calling is on at WhatsApp but off here. Press Turn off to turn it off there too.'],
            default => ['level' => 'warning', 'message' => 'Calling is off at WhatsApp but on here. Press Turn on to turn it on there.'],
        };
    }

    private function status(CallingApiResult $result): ?string
    {
        $status = $result->data['calling_status'] ?? null;

        return in_array($status, ['ENABLED', 'DISABLED'], true) ? $status : null;
    }

    /**
     * @param  array<string, mixed>  $intent
     */
    private function observe(LeadSource $source, string $status, Carbon $observedAt, array $intent = []): bool
    {
        return LeadSource::query()
            ->whereKey($source->id)
            ->where(fn ($q) => $q->whereNull('calling_meta_checked_at')->orWhere('calling_meta_checked_at', '<=', $observedAt))
            ->update([...$intent, 'calling_meta_status' => $status, 'calling_meta_checked_at' => $observedAt]) === 1;
    }
}
