<?php

namespace App\Leads\Actions;

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;
use App\Leads\Models\MessengerMessageTemplate;
use App\Models\Admin;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Creates and deletes a Page's Messenger Utility template directly with
 * Meta (same rules as OptiFin): one per Page; the CMS only saves it once
 * Meta confirms; a template Meta rejects for its wording is removed again
 * and the reason shown. Approved templates can't be edited — delete and
 * create a new one.
 *
 * @return array{ok: bool, message: string}
 */
class ManageMessengerTemplate
{
    /**
     * @return array{ok: bool, message: string}
     */
    public function create(Admin $actor, LeadSource $source, string $name, string $language, string $body): array
    {
        if ($source->type !== LeadSourceType::FacebookMessenger) {
            return ['ok' => false, 'message' => 'Templates can only be created for Messenger channels.'];
        }

        [$pageId, $token] = $this->credentials($source);

        if ($pageId === null || $token === null) {
            return ['ok' => false, 'message' => 'Add the Page ID and access token to this channel before creating a template.'];
        }

        if (MessengerMessageTemplate::query()->where('lead_source_id', $source->id)->exists()) {
            return ['ok' => false, 'message' => 'This Page already has a template. Delete it first to create a replacement.'];
        }

        preg_match_all('/\{\{(\d+)\}\}/', $body, $matches);
        $numbers = array_map('intval', $matches[1]);
        $variableCount = $numbers === [] ? 0 : max($numbers);

        $component = ['type' => 'BODY', 'text' => $body];

        if ($variableCount > 0) {
            $component['example'] = ['body_text' => [array_map(fn (int $n): string => "Example {$n}", range(1, $variableCount))]];
        }

        try {
            $response = Http::timeout(15)->post("https://graph.facebook.com/v26.0/{$pageId}/message_templates", [
                'access_token' => $token,
                'name' => $name,
                'language' => $language,
                'category' => 'UTILITY',
                'components' => [$component],
            ]);
        } catch (ConnectionException) {
            return ['ok' => false, 'message' => 'Could not reach Meta. Please try again.'];
        }

        if (! $response->successful()) {
            $this->log($actor, $source, 'meta_rejected', ['name' => $name, 'error' => $response->json('error')]);

            return ['ok' => false, 'message' => $response->json('error.message') ?? 'Meta rejected this template.'];
        }

        if ($response->json('status') === 'REJECTED') {
            $reason = Http::timeout(15)->get('https://graph.facebook.com/v26.0/'.$response->json('id'), ['access_token' => $token, 'fields' => 'rejected_reason'])->json('rejected_reason');
            $this->deleteOnMeta($pageId, $token, $name);
            $this->log($actor, $source, 'meta_content_rejected', ['name' => $name, 'reason' => $reason]);

            return ['ok' => false, 'message' => 'Meta rejected this template\'s wording ('.($reason ?? 'no reason given').'). A Utility template must read as an update about something the customer already has with you (an order, a request, an appointment), not an invitation to chat or an offer. Rewrite it and try again — the name is free to reuse.'];
        }

        MessengerMessageTemplate::create([
            'lead_source_id' => $source->id,
            'name' => $name,
            'language' => $language,
            'body_text' => $body,
            'variable_count' => $variableCount,
            'is_active' => true,
        ]);

        $this->log($actor, $source, 'created', ['name' => $name, 'status' => $response->json('status')]);

        return ['ok' => true, 'message' => 'Template created with Meta — it reports it as '.($response->json('status') ?? 'unknown').'.'];
    }

    /**
     * @return array{ok: bool, message: string}
     */
    public function delete(Admin $actor, MessengerMessageTemplate $template): array
    {
        [$pageId, $token] = $this->credentials($template->leadSource);

        if ($pageId === null || $token === null) {
            return ['ok' => false, 'message' => 'Add the Page ID and access token to this channel before deleting its template.'];
        }

        try {
            $response = Http::timeout(15)->withQueryParameters(['access_token' => $token, 'name' => $template->name])
                ->delete("https://graph.facebook.com/v26.0/{$pageId}/message_templates");
        } catch (ConnectionException) {
            return ['ok' => false, 'message' => 'Could not reach Meta. Please try again.'];
        }

        // Already gone on Meta's side counts as deleted.
        $alreadyGone = str_contains(strtolower((string) $response->json('error.message')), 'does not exist');

        if (! $response->successful() && ! $alreadyGone) {
            return ['ok' => false, 'message' => $response->json('error.message') ?? 'Meta could not delete this template.'];
        }

        $template->delete();
        $this->log($actor, $template->leadSource, 'deleted', ['name' => $template->name]);

        return ['ok' => true, 'message' => 'Template deleted — you can create a replacement now.'];
    }

    private function deleteOnMeta(string $pageId, string $token, string $name): void
    {
        try {
            Http::timeout(15)->withQueryParameters(['access_token' => $token, 'name' => $name])->delete("https://graph.facebook.com/v26.0/{$pageId}/message_templates");
        } catch (Throwable $e) {
            Log::warning('Messenger template: could not clean up a rejected template on Meta', ['name' => $name, 'error' => $e->getMessage()]);
        }
    }

    /**
     * @return array{0: string|null, 1: string|null}
     */
    private function credentials(LeadSource $source): array
    {
        $config = $source->config ?? [];
        $pageId = $config['page_id'] ?? null;
        $token = $config['page_access_token'] ?? null;

        return [is_string($pageId) && $pageId !== '' ? $pageId : null, is_string($token) && $token !== '' ? $token : null];
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function log(Admin $actor, LeadSource $source, string $outcome, array $context): void
    {
        Log::info('MESSENGER TEMPLATE', ['lead_source_id' => $source->id, 'outcome' => $outcome, 'admin_id' => $actor->id, ...$context]);
    }
}
