<?php

namespace App\Leads\Calling;

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Creates the "may we call you?" message (with Meta's Allow calls button)
 * for one WhatsApp number, as OptiFin does. If Meta rejects the wording, it
 * is removed and the next try automatically uses a new name, because Meta
 * won't reuse a rejected name.
 */
class CreateCallPermissionTemplate
{
    public const string NAME_KEY = 'call_permission_template_name';

    public const string CREATED_KEY = 'call_permission_template_status';

    /**
     * Every template on the WhatsApp account (name, status, whether it has
     * the "Allow calls" button), or null when Meta couldn't be asked.
     *
     * @return array<int, array{name: string, status: string, permission: bool}>|null
     */
    private function templates(string $base, string $waba, string $token): ?array
    {
        $found = [];
        $url = "{$base}/{$waba}/message_templates";
        $query = ['access_token' => $token, 'fields' => 'name,status,components', 'limit' => 100];

        for ($page = 0; $page < 10 && $url !== null; $page++) {
            try {
                $response = Http::timeout(15)->get($url, $query);
            } catch (Throwable) {
                return null;
            }

            if (! $response->successful()) {
                return null;
            }

            foreach ((array) $response->json('data') as $item) {
                if (! is_array($item) || ! is_string($item['name'] ?? null)) {
                    continue;
                }

                $permission = false;

                foreach ((array) ($item['components'] ?? []) as $component) {
                    if (is_array($component) && strtolower((string) ($component['type'] ?? '')) === 'call_permission_request') {
                        $permission = true;
                    }
                }

                $found[] = ['name' => $item['name'], 'status' => strtoupper((string) ($item['status'] ?? 'UNKNOWN')), 'permission' => $permission];
            }

            $next = $response->json('paging.next');
            $url = is_string($next) && $next !== '' ? $next : null;
            $query = [];
        }

        return $found;
    }

    public static function nameFor(LeadSource $source): string
    {
        $config = is_array($source->config) ? $source->config : [];
        $stored = $config[self::NAME_KEY] ?? null;

        return is_string($stored) && $stored !== '' ? $stored : (string) config('calling.call_permission_request_template.name');
    }

    public static function nextName(string $current): string
    {
        return preg_match('/^(.*)_v(\d+)$/', $current, $m) === 1 ? $m[1].'_v'.((int) $m[2] + 1) : $current.'_v2';
    }

    /**
     * @return array{ok: bool, message: string}
     */
    public function handle(LeadSource $source): array
    {
        if ($source->type !== LeadSourceType::Whatsapp) {
            return ['ok' => false, 'message' => 'This only works for WhatsApp numbers.'];
        }

        $config = is_array($source->config) ? $source->config : [];
        $waba = $config['whatsapp_business_account_id'] ?? null;
        $token = $config['access_token'] ?? null;

        if (! is_string($waba) || $waba === '' || ! is_string($token) || $token === '') {
            return ['ok' => false, 'message' => 'The mother admin needs to add the WhatsApp Business Account ID and Access Token to this number on Lead Sources first.'];
        }

        $template = (array) config('calling.call_permission_request_template');
        $name = self::nameFor($source);
        $base = 'https://graph.facebook.com/'.config('calling.graph_version');

        // Never make a duplicate: any usable "Allow calls" message already on
        // this WhatsApp account (e.g. made from OptiFin) is simply used —
        // whatever its name — and nothing is created.
        $all = $this->templates($base, $waba, $token);

        if ($all === null) {
            return ['ok' => false, 'message' => 'Could not check with WhatsApp. Try again in a few minutes.'];
        }

        $usable = array_values(array_filter($all, fn (array $t): bool => $t['permission']
            && ! in_array($t['status'], ['REJECTED', 'DELETED', 'PENDING_DELETION', 'DISABLED', 'PAUSED'], true)));
        usort($usable, fn (array $a, array $b): int => ($b['status'] === 'APPROVED') <=> ($a['status'] === 'APPROVED'));

        if ($usable !== []) {
            $chosen = $usable[0];
            $source->update(['config' => [...$config, self::NAME_KEY => $chosen['name'], self::CREATED_KEY => $chosen['status']]]);

            return ['ok' => true, 'message' => $chosen['status'] === 'APPROVED'
                ? "Ready — \"{$chosen['name']}\" is approved at Meta and will be used. Nothing was created."
                : "\"{$chosen['name']}\" already exists at Meta and is waiting for approval ({$chosen['status']}). Nothing was created."];
        }

        // None at all: create one, with a name Meta isn't using (or deleting).
        $taken = array_column($all, 'name');

        while (in_array($name, $taken, true)) {
            $name = self::nextName($name);
        }

        try {
            $response = Http::timeout(15)->post("{$base}/{$waba}/message_templates", [
                'access_token' => $token,
                'name' => $name,
                'language' => $template['language'] ?? 'en',
                'category' => 'UTILITY',
                'components' => [
                    ['type' => 'BODY', 'text' => $template['body'] ?? ''],
                    ['type' => 'FOOTER', 'text' => $template['footer'] ?? ''],
                    ['type' => 'call_permission_request'],
                ],
            ]);
        } catch (Throwable) {
            return ['ok' => false, 'message' => 'Could not reach WhatsApp. Try again in a few minutes.'];
        }

        if (! $response->successful()) {
            $message = $response->json('error.error_user_msg') ?? $response->json('error.message');

            return ['ok' => false, 'message' => is_string($message) ? $message : 'Meta rejected this message.'];
        }

        if ($response->json('status') === 'REJECTED') {
            $reason = null;

            try {
                $reason = Http::timeout(15)->get("{$base}/".$response->json('id'), ['access_token' => $token, 'fields' => 'rejected_reason'])->json('rejected_reason');
                Http::timeout(15)->withQueryParameters(['access_token' => $token, 'name' => $name])->delete("{$base}/{$waba}/message_templates");
            } catch (Throwable) {
                // Best effort clean-up.
            }

            $next = self::nextName($name);
            $source->update(['config' => [...$config, self::NAME_KEY => $next]]);

            return ['ok' => false, 'message' => 'Meta rejected the message ('.(is_string($reason) ? $reason : 'no reason given')."). The next try will use the new name \"{$next}\"."];
        }

        $status = (string) ($response->json('status') ?? 'PENDING');
        $source->update(['config' => [...$config, self::NAME_KEY => $name, self::CREATED_KEY => $status]]);

        return ['ok' => true, 'message' => "Permission message \"{$name}\" sent to Meta ({$status}). Approval usually takes a few hours."];
    }
}
