<?php

namespace App\Leads\Services\Meta;

use App\Leads\Enums\LeadSourceType;
use App\Leads\Jobs\ProcessEmailLeadSource;
use App\Leads\Mail\ImapClient;
use App\Leads\Models\LeadSource;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * "Test connection" on a channel — the same checks as OptiFin, including
 * its side effects: Facebook sources are subscribed to the right webhook
 * fields, and WhatsApp subscribes the Business Account when its id is set.
 */
class SourceConnectionTester
{
    public function __construct(
        private readonly MetaGraph $graph,
        private readonly ImapClient $imap,
    ) {}

    /**
     * @return array{success: bool, message: string}
     */
    public function test(LeadSource $source): array
    {
        $config = $source->config ?? [];

        return match ($source->type) {
            LeadSourceType::FacebookMessenger => $this->facebookPage($config, 'messages,messaging_postbacks', 'receive messages'),
            LeadSourceType::FacebookLeadAds => $this->facebookPage($config, 'leadgen', 'receive lead ad submissions'),
            LeadSourceType::Whatsapp => $this->whatsapp($config),
            LeadSourceType::Instagram => $this->instagram($config),
            LeadSourceType::LinkedInLeadGen => $this->linkedIn($config),
            LeadSourceType::Email => $this->email($config),
            LeadSourceType::Manual, LeadSourceType::ContactForm => ['success' => true, 'message' => 'This source has nothing external to test.'],
        };
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{success: bool, message: string}
     */
    private function facebookPage(array $config, string $fields, string $purpose): array
    {
        $pageId = (string) ($config['page_id'] ?? '');
        $token = (string) ($config['page_access_token'] ?? '');

        if ($pageId === '' || $token === '') {
            return ['success' => false, 'message' => 'Page ID and Page Access Token must both be set.'];
        }

        $name = $this->graph->pageName($pageId, $token) ?? $pageId;
        $subscription = $this->graph->subscribePage($pageId, $token, $fields);

        return $subscription['success']
            ? ['success' => true, 'message' => "Connected to Facebook Page \"{$name}\" and subscribed it to {$purpose}."]
            : ['success' => false, 'message' => "Connected to Facebook Page \"{$name}\", but subscribing it to {$purpose} failed: {$subscription['error']}"];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{success: bool, message: string}
     */
    private function whatsapp(array $config): array
    {
        $phoneNumberId = (string) ($config['phone_number_id'] ?? '');
        $token = (string) ($config['access_token'] ?? '');
        $wabaId = (string) ($config['whatsapp_business_account_id'] ?? '');

        if ($phoneNumberId === '' || $token === '') {
            return ['success' => false, 'message' => 'Phone Number ID and Access Token must both be set.'];
        }

        $number = $this->graph->whatsappNumber($phoneNumberId, $token);

        if (! $number['ok']) {
            return ['success' => false, 'message' => "WhatsApp rejected the request: {$number['error']}"];
        }

        $name = $number['name'] ?? $phoneNumberId;

        if ($wabaId === '') {
            return ['success' => true, 'message' => "Connected to WhatsApp number \"{$name}\" successfully. Add the WhatsApp Business Account ID to also auto-subscribe this app to receive messages — without it, the webhook can verify but never actually receive one."];
        }

        $subscription = $this->graph->subscribeWhatsappBusinessAccount($wabaId, $token);

        return $subscription['success']
            ? ['success' => true, 'message' => "Connected to WhatsApp number \"{$name}\" and subscribed the app to receive messages."]
            : ['success' => false, 'message' => "Connected to WhatsApp number \"{$name}\", but subscribing the app to receive messages failed: {$subscription['error']}"];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{success: bool, message: string}
     */
    private function instagram(array $config): array
    {
        $accountId = (string) ($config['instagram_account_id'] ?? '');
        $token = (string) ($config['access_token'] ?? '');

        if ($accountId === '' || $token === '') {
            return ['success' => false, 'message' => 'Instagram Business Account ID and Access Token must both be set.'];
        }

        $account = $this->graph->instagramAccount($accountId, $token, (string) ($config['auth_mode'] ?? 'facebook'));

        return $account['ok']
            ? ['success' => true, 'message' => 'Connected to Instagram account "'.($account['name'] ?? $accountId).'" successfully.']
            : ['success' => false, 'message' => "Instagram rejected the request: {$account['error']}"];
    }

    /**
     * LinkedIn is set up but doesn't bring in leads yet (same as OptiFin,
     * pending LinkedIn's API approval).
     *
     * @param  array<string, mixed>  $config
     * @return array{success: bool, message: string}
     */
    private function linkedIn(array $config): array
    {
        $urn = (string) ($config['organization_urn'] ?? '');
        $token = (string) ($config['access_token'] ?? '');

        if ($urn === '') {
            return ['success' => false, 'message' => 'Organization / Sponsored Account URN must be set.'];
        }

        if ($token === '') {
            return ['success' => false, 'message' => 'This source has no LinkedIn access token yet.'];
        }

        $version = config('services.linkedin.api_version');

        if (! is_string($version) || $version === '') {
            return ['success' => false, 'message' => 'LINKEDIN_API_VERSION is not configured — set it before testing a LinkedIn connection.'];
        }

        $owner = str_contains($urn, ':sponsoredAccount:') ? 'sponsoredAccount' : 'organization';

        try {
            $response = Http::withToken($token)
                ->withHeaders(['Linkedin-Version' => $version, 'X-Restli-Protocol-Version' => '2.0.0'])
                ->timeout(10)
                ->get('https://api.linkedin.com/rest/leadForms', ['q' => 'owner', 'owner' => "({$owner}:{$urn})", 'count' => 1]);
        } catch (ConnectionException) {
            return ['success' => false, 'message' => 'Could not reach the LinkedIn API.'];
        }

        return $response->successful()
            ? ['success' => true, 'message' => 'Connected to LinkedIn successfully.']
            : ['success' => false, 'message' => 'LinkedIn rejected the request: '.($response->json('message') ?? 'unknown error')];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{success: bool, message: string}
     */
    private function email(array $config): array
    {
        if (! extension_loaded('imap')) {
            return ['success' => false, 'message' => 'The IMAP extension is not available on this server.'];
        }

        $connection = $this->imap->open(ProcessEmailLeadSource::mailboxString($config), (string) ($config['imap_username'] ?? ''), (string) ($config['imap_password'] ?? ''), halfOpen: true);

        if ($connection === null) {
            return ['success' => false, 'message' => 'Unable to connect: '.$this->imap->lastError()];
        }

        $this->imap->close($connection);

        return ['success' => true, 'message' => 'Connection successful.'];
    }
}
