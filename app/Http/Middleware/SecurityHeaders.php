<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // HSTS and a strict CSP are only safe to force once the app is
        // actually served over HTTPS with a known set of build assets —
        // enabling them locally would break plain http://localhost dev and
        // Vite's dev-server HMR.
        if (app()->isProduction()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy($response));
        }

        return $response;
    }

    /**
     * Allowlist covers every third-party origin actually referenced by the
     * frontend: Google Pay's SDK, SSLCommerz's embedded-checkout script and
     * widget, Google Fonts, the Reverb websocket, the Google Maps embed on
     * the contact page, and the 3D-Secure bank redirect form that SSLCommerz
     * injects during card payments (hence the permissive form-action).
     */
    private function contentSecurityPolicy(Response $response): string
    {
        $reverb = config('csp.reverb');
        $reverbOrigin = "{$reverb['scheme']}://{$reverb['host']}:{$reverb['port']}";

        $directives = [
            "default-src 'self'",
            "script-src 'self' 'wasm-unsafe-eval' {$this->scriptHashes($response)}https://pay.google.com https://sandbox.sslcommerz.com https://securepay.sslcommerz.com",
            // Inertia injects the progress-bar/error-modal CSS inline at
            // runtime with no nonce support in the installed package
            // version (added later in the 3.x line) — 'unsafe-inline' here
            // only weakens CSS injection, not script execution.
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "media-src 'self' https:",
            "connect-src 'self' https://pay.google.com {$reverbOrigin}",
            "frame-src 'self' https://www.google.com https://sandbox.sslcommerz.com https://securepay.sslcommerz.com",
            "form-action 'self' https:",
            "worker-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'self'",
        ];

        return implode('; ', $directives);
    }

    /**
     * Inertia embeds the initial page payload as an inline
     * `<script data-page type="application/json">`, which CSP's script-src
     * governs regardless of the non-executable MIME type, and which has no
     * nonce hook for this specific tag. Its content is fully
     * server-controlled (json_encode of the resolved page props) and
     * differs per response, so it's allowed via a hash computed from what
     * was actually rendered rather than 'unsafe-inline'.
     */
    private function scriptHashes(Response $response): string
    {
        $content = $response->getContent();

        if (! is_string($content) || ! str_contains((string) $response->headers->get('Content-Type'), 'text/html')) {
            return '';
        }

        if (! preg_match('/<script data-page="[^"]*" type="application\/json">(.*?)<\/script>/s', $content, $matches)) {
            return '';
        }

        return "'sha256-".base64_encode(hash('sha256', $matches[1], true))."' ";
    }
}
