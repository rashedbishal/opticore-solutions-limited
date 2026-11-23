<?php

namespace App\Leads\Calling;

use App\Leads\Enums\CallingApiError;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;

/**
 * Meta's WhatsApp Business Calling API for one WhatsApp number (same
 * requests as OptiFin).
 */
class WhatsAppCallingClient
{
    public function __construct(private readonly LeadSource $source)
    {
        if ($source->type !== LeadSourceType::Whatsapp) {
            throw new InvalidArgumentException('Calling needs a WhatsApp lead source.');
        }
    }

    public function getSettings(): CallingApiResult
    {
        return $this->request('GET', 'settings', null, true, function (array $body): array {
            $calling = is_array($body['calling'] ?? null) ? $body['calling'] : [];
            $status = $calling['status'] ?? null;

            return ['calling_status' => is_string($status) && $status !== '' ? strtoupper($status) : null];
        });
    }

    public function setCallingStatus(bool $enabled): CallingApiResult
    {
        return $this->request('POST', 'settings', ['calling' => ['status' => $enabled ? 'ENABLED' : 'DISABLED']], false, fn (array $body): ?array => $this->successFlag($body));
    }

    public function preAccept(string $callId, string $sdpAnswer): CallingApiResult
    {
        return $this->action('pre_accept', $callId, $sdpAnswer);
    }

    public function accept(string $callId, string $sdpAnswer): CallingApiResult
    {
        return $this->action('accept', $callId, $sdpAnswer);
    }

    public function reject(string $callId): CallingApiResult
    {
        return $this->action('reject', $callId);
    }

    public function terminate(string $callId): CallingApiResult
    {
        return $this->action('terminate', $callId);
    }

    private function action(string $action, string $callId, ?string $sdpAnswer = null): CallingApiResult
    {
        $body = ['messaging_product' => 'whatsapp', 'call_id' => $callId, 'action' => $action];

        if ($sdpAnswer !== null) {
            $body['session'] = ['sdp_type' => 'answer', 'sdp' => $sdpAnswer];
        }

        return $this->request('POST', 'calls', $body, false, fn (array $response): ?array => $this->successFlag($response));
    }

    /**
     * @param  array<string, mixed>|null  $body
     */
    private function request(string $method, string $path, ?array $body, bool $retryOnce, callable $parse): CallingApiResult
    {
        $config = is_array($this->source->config) ? $this->source->config : [];
        $phoneNumberId = $config['phone_number_id'] ?? null;
        $token = $config['access_token'] ?? null;

        if (! is_string($phoneNumberId) || $phoneNumberId === '' || ! is_string($token) || $token === '') {
            return CallingApiResult::failure(CallingApiError::Validation, null, null);
        }

        $url = sprintf('https://graph.facebook.com/%s/%s/%s', config('calling.graph_version'), rawurlencode($phoneNumberId), $path);
        $attempts = $retryOnce ? 2 : 1;

        for ($attempt = 1; $attempt <= $attempts; $attempt++) {
            $last = $attempt === $attempts;

            try {
                $pending = Http::withToken($token)->acceptJson()
                    ->timeout((int) config('calling.api_timeout_seconds'))
                    ->connectTimeout((int) config('calling.api_connect_timeout_seconds'));
                $response = $method === 'GET' ? $pending->get($url, $body ?? []) : $pending->asJson()->post($url, $body ?? []);
            } catch (ConnectionException) {
                if ($last) {
                    return CallingApiResult::failure(CallingApiError::Network, null, null);
                }

                continue;
            }

            if ($response->serverError() && ! $last) {
                continue;
            }

            return $this->result($response, $parse);
        }

        return CallingApiResult::failure(CallingApiError::Unknown, null, null);
    }

    private function result(Response $response, callable $parse): CallingApiResult
    {
        $json = $response->json();

        if ($response->successful()) {
            $data = is_array($json) ? $parse($json) : null;

            return is_array($data)
                ? CallingApiResult::success($response->status(), $data)
                : CallingApiResult::failure(CallingApiError::InvalidResponse, null, $response->status());
        }

        $error = is_array($json) && is_array($json['error'] ?? null) ? $json['error'] : [];
        $code = isset($error['code']) && is_numeric($error['code']) ? (int) $error['code'] : null;

        return CallingApiResult::failure(CallingApiError::classify($code, $response->status()), $code, $response->status());
    }

    /**
     * @param  array<string, mixed>  $body
     * @return array<string, mixed>|null
     */
    private function successFlag(array $body): ?array
    {
        return ($body['success'] ?? null) === true ? [] : null;
    }
}
