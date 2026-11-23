<?php

namespace App\Leads\Services\Meta;

use App\Leads\Enums\TokenCheckStatus;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadSourceTokenCheck;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Str;

/**
 * Asks Meta whether a source's key still works and when it expires (the
 * key inspects itself, read-only). Records only the result, never the key.
 */
class MetaTokenChecker
{
    public function __construct(private readonly MetaGraph $graph) {}

    public function check(LeadSource $source): LeadSourceTokenCheck
    {
        $token = $source->metaAccessToken();

        if ($token === null) {
            return $this->record($source, TokenCheckStatus::Missing);
        }

        try {
            if (($source->config['auth_mode'] ?? 'facebook') === 'instagram') {
                $response = $this->graph->instagramMe($token);

                if ($response->serverError()) {
                    return $this->record($source, TokenCheckStatus::Unreachable, error: $this->error($response->json('error.message')));
                }

                return $response->successful()
                    ? $this->record($source, TokenCheckStatus::Valid)
                    : $this->record($source, TokenCheckStatus::Invalid, error: $this->error($response->json('error.message')));
            }

            $response = $this->graph->debugToken($token);
        } catch (ConnectionException) {
            return $this->record($source, TokenCheckStatus::Unreachable, error: 'Meta could not be reached.');
        }

        if ($response->serverError()) {
            return $this->record($source, TokenCheckStatus::Unreachable, error: $this->error($response->json('error.message')));
        }

        if ($response->failed() || $response->json('data.is_valid') !== true) {
            return $this->record($source, TokenCheckStatus::Invalid, error: $this->error($response->json('error.message') ?? $response->json('data.error.message')));
        }

        $expiresAt = (int) $response->json('data.expires_at', 0);

        return $this->record($source, TokenCheckStatus::Valid, $expiresAt > 0 ? CarbonImmutable::createFromTimestamp($expiresAt) : null, expiryKnown: true);
    }

    private function record(LeadSource $source, TokenCheckStatus $status, ?CarbonImmutable $expiresAt = null, bool $expiryKnown = false, ?string $error = null): LeadSourceTokenCheck
    {
        return LeadSourceTokenCheck::query()->updateOrCreate(
            ['lead_source_id' => $source->id],
            ['status' => $status, 'expires_at' => $expiresAt, 'expiry_known' => $expiryKnown, 'error' => $error, 'checked_at' => now()],
        );
    }

    private function error(mixed $message): ?string
    {
        return is_string($message) && $message !== '' ? Str::limit($message, 480) : null;
    }
}
