<?php

namespace App\Support;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Thin HTTP client for SSLCommerz's "Merchant Hosted Payment API", used only
 * for the Google Pay integration. Deliberately separate from
 * App\Library\SslCommerz\* (the classic Easy Checkout integration) — a
 * different API surface with its own request/response shapes.
 */
class GooglePaySslCommerz
{
    /**
     * @return array<string, mixed>
     */
    public function fetchConfig(): array
    {
        return $this->callMerchantHostedPayment(['action' => 'googlepayConfig']);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function initiateTransaction(array $payload): array
    {
        return $this->callMerchantHostedPayment(['action' => 'initiateTransaction', ...$payload]);
    }

    /**
     * Submit the Google Pay token to the one-time action URL returned by
     * initiateTransaction. Not part of the merchant-hosted-payment endpoint
     * and does not need store credentials.
     *
     * @return array<string, mixed>
     */
    public function submitToken(string $actionUrl, string $sessionKey, string $signatureData): array
    {
        try {
            $response = Http::asJson()->timeout(15)->post($actionUrl, [
                'session_key' => $sessionKey,
                'en_signature_data' => $signatureData,
            ]);
        } catch (ConnectionException $e) {
            return ['status' => 'FAILED', 'message' => $e->getMessage()];
        }

        $data = $response->json();

        return is_array($data) ? $data : ['status' => 'FAILED', 'message' => 'Invalid response from SSLCommerz.'];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function callMerchantHostedPayment(array $payload): array
    {
        $url = rtrim((string) config('sslcommerz_googlepay.base_url'), '/').config('sslcommerz_googlepay.endpoint');

        try {
            $response = Http::asJson()->timeout(15)->post($url, [
                'store_id' => config('sslcommerz.apiCredentials.store_id'),
                'store_passwd' => config('sslcommerz.apiCredentials.store_password'),
                ...$payload,
            ]);
        } catch (ConnectionException $e) {
            return ['APIConnect' => 'FAILED', 'status_code' => 0, 'failed_reason' => $e->getMessage()];
        }

        $data = $response->json();

        return is_array($data) ? $data : ['APIConnect' => 'FAILED', 'status_code' => $response->status(), 'failed_reason' => 'Invalid response from SSLCommerz.'];
    }
}
