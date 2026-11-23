<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Leads\Actions\SubmitWebsiteForm;
use App\Leads\Models\WebsiteForm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

/**
 * Public endpoint the website forms post to. Accepts JSON or a normal form
 * post; answers JSON to scripts and a small thank-you page to browsers.
 */
class WebsiteFormController extends Controller
{
    public function submit(Request $request, string $token, SubmitWebsiteForm $submit): JsonResponse|Response
    {
        $form = WebsiteForm::query()
            ->with(['fields', 'leadSource'])
            ->where('token_hash', WebsiteForm::hashToken($token))
            ->where('is_active', true)
            ->first();

        abort_if($form === null, 404);

        $origin = $request->header('Origin') ?: $request->header('Referer');
        $host = is_string($origin) ? parse_url($origin, PHP_URL_HOST) : null;

        if (! $form->allowsHost(is_string($host) ? $host : null)) {
            $reason = $host !== null
                ? "Website form \"{$form->name}\" rejected a submission from \"{$host}\", which isn't in its allowed websites."
                : "Website form \"{$form->name}\" rejected a submission that didn't say which website it came from.";

            Log::warning($reason);
            $form->leadSource->update(['last_signature_rejection_at' => now(), 'last_signature_rejection_reason' => $reason]);

            abort(403, 'This website is not allowed to send this form.');
        }

        $submit->handle($form, $request->all());

        if ($request->wantsJson() || $request->isJson()) {
            return response()->json(['status' => 'ok']);
        }

        return response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thank you</title><p style="font-family:system-ui;padding:2rem;text-align:center">Thank you! We received your message and will be in touch soon.</p>', 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }
}
