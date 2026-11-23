<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Enums\MessageChannel;
use App\Leads\Enums\MessageStatus;
use App\Leads\Jobs\ReconcileOutboundMessageStatus;
use App\Leads\Models\LeadSource;
use App\Leads\Services\Meta\InboundChannels;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Meta webhooks for leads: Facebook (Messenger + Lead Ads share one URL),
 * Instagram and WhatsApp. Always answers 200 so Meta never disables the
 * subscription because of one bad item — except a lock timeout, which
 * returns 503 so Meta retries that delivery. One failing item never stops
 * the rest of the delivery. Delivery/read receipts for messages staff sent
 * update those messages' ticks in the background.
 */
class LeadWebhookController extends Controller
{
    private bool $retryRequested = false;

    public function __construct(private readonly InboundChannels $channels) {}

    public function verifyFacebook(Request $request): Response
    {
        return $this->verify($request, [LeadSourceType::FacebookMessenger, LeadSourceType::FacebookLeadAds]);
    }

    public function verifyInstagram(Request $request): Response
    {
        return $this->verify($request, [LeadSourceType::Instagram]);
    }

    public function verifyWhatsapp(Request $request): Response
    {
        return $this->verify($request, [LeadSourceType::Whatsapp]);
    }

    public function facebook(Request $request): JsonResponse
    {
        $entries = $request->array('entry');

        if ($this->overCap($this->countMessaging($entries))) {
            return $this->ok();
        }

        foreach ($entries as $entry) {
            $pageId = (string) ($entry['id'] ?? '');

            foreach (($entry['messaging'] ?? []) as $messaging) {
                $source = $this->source(LeadSourceType::FacebookMessenger, 'page_id', $pageId);

                if (isset($messaging['delivery']) || isset($messaging['read'])) {
                    $this->receipt($source, MessageChannel::Messenger, $messaging);

                    continue;
                }

                if ($source !== null) {
                    $this->safely('Facebook Messenger', fn () => $this->channels->messengerItem($source, $messaging));
                }
            }

            foreach (($entry['changes'] ?? []) as $change) {
                if (($change['field'] ?? null) !== 'leadgen') {
                    continue;
                }

                $value = $change['value'] ?? [];
                $source = $this->source(LeadSourceType::FacebookLeadAds, 'page_id', (string) ($value['page_id'] ?? $pageId));

                if ($source === null) {
                    Log::error('Facebook lead ad received, but no active Facebook Lead Ads source is configured.');

                    continue;
                }

                $this->safely('Facebook Lead Ads', fn () => $this->channels->leadAd($source, $value));
            }
        }

        return $this->ok();
    }

    public function instagram(Request $request): JsonResponse
    {
        $entries = $request->array('entry');

        if ($this->overCap($this->countMessaging($entries))) {
            return $this->ok();
        }

        foreach ($entries as $entry) {
            $source = $this->source(LeadSourceType::Instagram, 'instagram_account_id', (string) ($entry['id'] ?? ''));

            if ($source === null) {
                continue;
            }

            foreach (($entry['messaging'] ?? []) as $messaging) {
                if (isset($messaging['delivery']) || isset($messaging['read'])) {
                    $this->receipt($source, MessageChannel::Instagram, $messaging);

                    continue;
                }

                $this->safely('Instagram', fn () => $this->channels->instagramItem($source, $messaging));
            }
        }

        return $this->ok();
    }

    public function whatsapp(Request $request): JsonResponse
    {
        $entries = $request->array('entry');
        $count = 0;

        foreach ($entries as $entry) {
            foreach (($entry['changes'] ?? []) as $change) {
                $count += count($change['value']['messages'] ?? []);
            }
        }

        if ($this->overCap($count)) {
            return $this->ok();
        }

        foreach ($entries as $entry) {
            foreach (($entry['changes'] ?? []) as $change) {
                $phoneNumberId = (string) ($change['value']['metadata']['phone_number_id'] ?? '');
                $source = $this->source(LeadSourceType::Whatsapp, 'phone_number_id', $phoneNumberId);

                if ($source === null) {
                    continue;
                }

                foreach (($change['value']['statuses'] ?? []) as $status) {
                    $this->whatsappStatus($status);
                }

                foreach (($change['value']['messages'] ?? []) as $message) {
                    $this->safely('WhatsApp', fn () => $this->channels->whatsappMessage($source, $change, $message));
                }
            }
        }

        return $this->ok();
    }

    /**
     * A Messenger/Instagram delivery or read receipt for messages staff sent.
     *
     * @param  array<string, mixed>  $messaging
     */
    private function receipt(?LeadSource $source, MessageChannel $channel, array $messaging): void
    {
        $event = $messaging['delivery'] ?? $messaging['read'] ?? null;
        $customerId = (string) ($messaging['sender']['id'] ?? '');

        if ($source === null || ! is_array($event) || $customerId === '') {
            return;
        }

        $mids = is_array($event['mids'] ?? null) ? array_values(array_filter($event['mids'], 'is_string')) : [];
        $watermark = $event['watermark'] ?? null;

        if ($mids === [] && $watermark === null) {
            return;
        }

        ReconcileOutboundMessageStatus::dispatch(
            $channel,
            isset($messaging['delivery']) ? MessageStatus::Delivered : MessageStatus::Read,
            externalMessageIds: $mids,
            leadSourceId: $source->id,
            threadId: $customerId,
            watermarkTimestamp: is_numeric($watermark) ? (int) ((float) $watermark / 1000) : null,
        );
    }

    /**
     * A WhatsApp sent/delivered/read/failed update for a message staff sent.
     *
     * @param  array<string, mixed>  $status
     */
    private function whatsappStatus(array $status): void
    {
        $wamid = $status['id'] ?? null;
        $value = is_string($status['status'] ?? null) ? MessageStatus::tryFrom($status['status']) : null;

        if (! is_string($wamid) || $wamid === '' || $value === null) {
            return;
        }

        $reason = $value === MessageStatus::Failed
            ? ($status['errors'][0]['title'] ?? $status['errors'][0]['message'] ?? 'WhatsApp reported a delivery failure.')
            : null;

        ReconcileOutboundMessageStatus::dispatch(MessageChannel::Whatsapp, $value, externalMessageId: $wamid, failureReason: is_string($reason) ? $reason : null);
    }

    /**
     * Meta's subscription check: echo the challenge when the verify token
     * matches an active source of these types.
     *
     * @param  array<int, LeadSourceType>  $types
     */
    private function verify(Request $request, array $types): Response
    {
        $token = $request->query('hub_verify_token');

        $matches = is_string($token) && $token !== '' && LeadSource::query()
            ->whereIn('type', $types)
            ->where('is_active', true)
            ->get()
            ->contains(fn (LeadSource $source): bool => hash_equals((string) ($source->config['verify_token'] ?? ''), $token));

        abort_unless($request->query('hub_mode') === 'subscribe' && $matches, 403);

        return response((string) $request->query('hub_challenge', ''), 200);
    }

    /**
     * The active source of this type whose id matches; if none matches by
     * id but exactly one is active, that one (a single Page/number setup).
     */
    private function source(LeadSourceType $type, string $idKey, string $externalId): ?LeadSource
    {
        $sources = LeadSource::query()->where('type', $type)->where('is_active', true)->get();

        return $sources->first(fn (LeadSource $source): bool => $externalId !== '' && (string) ($source->config[$idKey] ?? '') === $externalId)
            ?? ($sources->count() === 1 ? $sources->first() : null);
    }

    private function safely(string $channel, callable $work): void
    {
        try {
            $work();
        } catch (LockTimeoutException) {
            $this->retryRequested = true;
            Log::warning("{$channel} webhook item lock timed out; asking Meta to retry.");
        } catch (Throwable $e) {
            Log::error("{$channel} webhook item processing failed: {$e->getMessage()}");
        }
    }

    /**
     * @param  array<int, mixed>  $entries
     */
    private function countMessaging(array $entries): int
    {
        $count = 0;

        foreach ($entries as $entry) {
            foreach (($entry['messaging'] ?? []) as $messaging) {
                if (! isset($messaging['delivery']) && ! isset($messaging['read'])) {
                    $count++;
                }
            }
        }

        return $count;
    }

    private function overCap(int $count): bool
    {
        if ($count > (int) config('leads.max_inbound_messages_per_request')) {
            Log::warning("Rejected a lead webhook carrying {$count} messages (over the per-request limit).");

            return true;
        }

        return false;
    }

    private function ok(): JsonResponse
    {
        return $this->retryRequested
            ? response()->json(['status' => 'retry'], 503)
            : response()->json(['status' => 'ok']);
    }
}
