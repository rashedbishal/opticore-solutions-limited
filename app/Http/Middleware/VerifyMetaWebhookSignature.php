<?php

namespace App\Http\Middleware;

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Checks Meta's X-Hub-Signature-256 on lead webhooks against the App
 * Secret saved on the active sources of those types. Like OptiFin it fails
 * open while no App Secret is saved yet (the Lead Sources page warns about
 * that), and records rejections for the health warnings.
 */
class VerifyMetaWebhookSignature
{
    public function handle(Request $request, Closure $next, string ...$types): Response
    {
        $sources = LeadSource::query()
            ->whereIn('type', array_map(fn (string $type): LeadSourceType => LeadSourceType::from($type), $types))
            ->where('is_active', true)
            ->get()
            ->filter(fn (LeadSource $source): bool => is_string($source->config['app_secret'] ?? null) && $source->config['app_secret'] !== '');

        if ($sources->isEmpty()) {
            return $next($request);
        }

        $signature = (string) $request->header('X-Hub-Signature-256', '');

        foreach ($sources as $source) {
            $expected = 'sha256='.hash_hmac('sha256', $request->getContent(), (string) $source->config['app_secret']);

            if (str_starts_with($signature, 'sha256=') && hash_equals($expected, $signature)) {
                return $next($request);
            }
        }

        $label = implode('/', $types);
        Log::warning("Rejected {$label} webhook: signature mismatch.");

        foreach ($sources as $source) {
            if ($source->last_signature_rejection_at === null || $source->last_signature_rejection_at->lt(now()->subMinute())) {
                $source->update([
                    'last_signature_rejection_at' => now(),
                    'last_signature_rejection_reason' => "Signature mismatch on the {$label} webhook — the App Secret doesn't match what Meta signed this request with.",
                ]);
            }
        }

        abort(403);
    }
}
