<?php

namespace App\Leads\Services\Meta;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Every call this app makes to Meta's Graph API (Facebook, Instagram,
 * WhatsApp), with the same endpoints and versions as OptiFin. Callers get
 * plain values back; a network failure never throws past this class
 * unless noted.
 */
class MetaGraph
{
    private const GRAPH = 'https://graph.facebook.com';

    /**
     * A Messenger sender's name and picture, cached for a day.
     *
     * @return array{name: string|null, profile_pic: string|null}
     */
    public function facebookProfile(string $psid, ?string $pageAccessToken): array
    {
        return $this->cachedProfile("fb_profile_{$psid}", $pageAccessToken, function (string $token) use ($psid): Response {
            return Http::timeout(5)->get(self::GRAPH."/{$psid}", ['fields' => 'first_name,last_name,name,profile_pic', 'access_token' => $token]);
        }, function (Response $response): ?string {
            $name = $response->json('name');

            if (is_string($name) && $name !== '') {
                return $name;
            }

            $full = trim(($response->json('first_name') ?? '').' '.($response->json('last_name') ?? ''));

            return $full !== '' ? $full : null;
        });
    }

    /**
     * An Instagram sender's name (or username) and picture, cached for a day.
     *
     * @return array{name: string|null, profile_pic: string|null}
     */
    public function instagramProfile(string $igsid, ?string $accessToken, string $authMode): array
    {
        $host = $authMode === 'instagram' ? 'https://graph.instagram.com' : self::GRAPH;

        return $this->cachedProfile("ig_profile_{$igsid}", $accessToken, function (string $token) use ($host, $igsid): Response {
            return Http::timeout(5)->get("{$host}/{$igsid}", ['fields' => 'name,username,profile_pic', 'access_token' => $token]);
        }, function (Response $response): ?string {
            $name = $response->json('name') ?? $response->json('username');

            return is_string($name) && $name !== '' ? $name : null;
        });
    }

    /**
     * A Lead Ads submission's answers, or null when Meta won't give them.
     *
     * @return array{field_data: array<int, mixed>, ad_id: mixed}|null
     */
    public function leadgen(string $leadgenId, string $accessToken): ?array
    {
        try {
            $response = Http::timeout(10)->get(self::GRAPH."/v20.0/{$leadgenId}", ['access_token' => $accessToken]);
        } catch (ConnectionException $e) {
            Log::warning("Facebook lead ad [{$leadgenId}] fetch could not connect: {$e->getMessage()}");

            return null;
        }

        if (! $response->successful()) {
            if ((int) $response->json('error.code') === 100 && (int) $response->json('error.error_subcode') === 33) {
                Log::warning("Facebook lead ad [{$leadgenId}] fetch denied — leads_retrieval needs Advanced Access, or the submitter isn't added as a Tester/Developer on the app.");
            } else {
                Log::warning("Facebook lead ad [{$leadgenId}] fetch failed: HTTP {$response->status()} {$response->body()}");
            }

            return null;
        }

        return ['field_data' => $response->json('field_data') ?? [], 'ad_id' => $response->json('ad_id')];
    }

    public function leadFormName(string $formId, string $accessToken): ?string
    {
        return $this->nameOf(self::GRAPH."/v20.0/{$formId}", ['fields' => 'name', 'access_token' => $accessToken], 'name');
    }

    public function pageName(string $pageId, string $accessToken): ?string
    {
        return $this->nameOf(self::GRAPH."/{$pageId}", ['fields' => 'id,name', 'access_token' => $accessToken], 'name');
    }

    /**
     * Subscribes a Facebook Page to this app for the given webhook fields
     * (e.g. "messages,messaging_postbacks" or "leadgen").
     *
     * @return array{success: bool, error: string|null}
     */
    public function subscribePage(string $pageId, string $accessToken, string $fields): array
    {
        return $this->subscribe(self::GRAPH."/{$pageId}/subscribed_apps", ['subscribed_fields' => $fields, 'access_token' => $accessToken]);
    }

    /**
     * @return array{success: bool, error: string|null}
     */
    public function subscribeWhatsappBusinessAccount(string $wabaId, string $accessToken): array
    {
        return $this->subscribe(self::GRAPH."/{$wabaId}/subscribed_apps", ['access_token' => $accessToken]);
    }

    /**
     * @return array{ok: bool, name: string|null, error: string|null}
     */
    public function whatsappNumber(string $phoneNumberId, string $accessToken): array
    {
        return $this->lookup(self::GRAPH."/{$phoneNumberId}", ['fields' => 'verified_name,display_phone_number', 'access_token' => $accessToken], ['display_phone_number', 'verified_name']);
    }

    /**
     * @return array{ok: bool, name: string|null, error: string|null}
     */
    public function instagramAccount(string $accountId, string $accessToken, string $authMode): array
    {
        $host = $authMode === 'instagram' ? 'https://graph.instagram.com' : self::GRAPH;

        return $this->lookup("{$host}/{$accountId}", ['fields' => 'username,name', 'access_token' => $accessToken], ['username', 'name']);
    }

    /**
     * Meta's own description of a token (validity, expiry, scopes). Throws
     * ConnectionException when Meta can't be reached.
     */
    public function debugToken(string $token): Response
    {
        return Http::timeout(10)->get(self::GRAPH.'/debug_token', ['input_token' => $token, 'access_token' => $token]);
    }

    /** Throws ConnectionException when Instagram can't be reached. */
    public function instagramMe(string $token): Response
    {
        return Http::timeout(10)->get('https://graph.instagram.com/me', ['fields' => 'id', 'access_token' => $token]);
    }

    /** Throws ConnectionException when Meta can't be reached. */
    public function whatsappMediaLookup(string $mediaId, string $accessToken, ?string $phoneNumberId): Response
    {
        return Http::withToken($accessToken)->timeout(15)->get(self::GRAPH."/v21.0/{$mediaId}", array_filter(['phone_number_id' => $phoneNumberId]));
    }

    /**
     * @param  callable(string): Response  $request
     * @param  callable(Response): ?string  $name
     * @return array{name: string|null, profile_pic: string|null}
     */
    private function cachedProfile(string $cacheKey, ?string $token, callable $request, callable $name): array
    {
        $cached = Cache::get($cacheKey);

        if (is_array($cached)) {
            return [
                'name' => is_string($cached['name'] ?? null) ? $cached['name'] : null,
                'profile_pic' => is_string($cached['profile_pic'] ?? null) ? $cached['profile_pic'] : null,
            ];
        }

        $empty = ['name' => null, 'profile_pic' => null];

        if ($token === null || $token === '') {
            return $empty;
        }

        try {
            $response = $request($token);
        } catch (ConnectionException $e) {
            Log::warning("Meta profile lookup [{$cacheKey}] could not connect: {$e->getMessage()}");

            return $empty;
        }

        if (! $response->successful()) {
            Log::warning("Meta profile lookup [{$cacheKey}] failed: HTTP {$response->status()}");

            return $empty;
        }

        $picture = $response->json('profile_pic');
        $profile = [
            'name' => $name($response),
            'profile_pic' => is_string($picture) && $picture !== '' ? $picture : null,
        ];

        if ($profile['name'] !== null) {
            Cache::put($cacheKey, $profile, now()->addHours(24));
        }

        return $profile;
    }

    /**
     * @param  array<string, string>  $query
     */
    private function nameOf(string $url, array $query, string $key): ?string
    {
        try {
            $response = Http::timeout(10)->get($url, $query);
        } catch (ConnectionException) {
            return null;
        }

        $value = $response->successful() ? $response->json($key) : null;

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * @param  array<string, string>  $form
     * @return array{success: bool, error: string|null}
     */
    private function subscribe(string $url, array $form): array
    {
        try {
            $response = Http::asForm()->timeout(10)->post($url, $form);
        } catch (ConnectionException) {
            return ['success' => false, 'error' => 'Could not reach the Facebook Graph API.'];
        }

        if (! $response->successful() || $response->json('success') !== true) {
            return ['success' => false, 'error' => $response->json('error.message') ?? 'unknown error'];
        }

        return ['success' => true, 'error' => null];
    }

    /**
     * @param  array<string, string>  $query
     * @param  array<int, string>  $nameKeys
     * @return array{ok: bool, name: string|null, error: string|null}
     */
    private function lookup(string $url, array $query, array $nameKeys): array
    {
        try {
            $response = Http::timeout(10)->get($url, $query);
        } catch (ConnectionException) {
            return ['ok' => false, 'name' => null, 'error' => 'Could not reach Meta.'];
        }

        if (! $response->successful()) {
            return ['ok' => false, 'name' => null, 'error' => $response->json('error.message') ?? 'unknown error'];
        }

        foreach ($nameKeys as $key) {
            $value = $response->json($key);

            if (is_string($value) && $value !== '') {
                return ['ok' => true, 'name' => $value, 'error' => null];
            }
        }

        return ['ok' => true, 'name' => null, 'error' => null];
    }
}
