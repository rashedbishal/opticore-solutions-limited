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
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(self)');

        // HSTS and a strict CSP are only safe to force once the app is
        // actually served over HTTPS with a known set of build assets —
        // enabling them locally would break plain http://localhost dev and
        // Vite's dev-server HMR.
        if (app()->isProduction()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy($response, $request));
        }

        return $response;
    }

    /**
     * Allowlist covers every third-party origin actually referenced by the
     * frontend: Google Pay's SDK, SSLCommerz's embedded-checkout script and
     * widget, Google Fonts, the Reverb websocket, the Google Maps embed on
     * the contact page, and the 3D-Secure bank redirect form that SSLCommerz
     * injects during card payments (hence the permissive form-action).
     *
     * SSLCommerz embedded checkout spans four distinct domains, not one:
     * sandbox.sslcommerz.com/securepay.sslcommerz.com (API + sandbox embed),
     * seamless-epay.sslcommerz.com (live embed.min.js bootstrap script), and
     * pay.sslcommerz.com (the actual payment-form iframe the widget opens
     * once live credentials are used — sandbox mode never hits this one,
     * which is why it's easy to miss testing only against sandbox).
     *
     * Individual payment methods (bKash confirmed so far, via a real
     * production CSP violation report) get framed directly at their own
     * domain instead of staying inside an sslcommerz.com wrapper, and
     * SSLCommerz can add/change which bank or wallet domain that is at any
     * time without us knowing in advance — enumerating them one CSP
     * violation at a time forever isn't sustainable. Since `Checkout.tsx` is
     * the *only* page that renders this embed, frame-src is widened to any
     * HTTPS origin exclusively on the checkout route (same "can't enumerate,
     * so widen" call already made for form-action below) rather than
     * site-wide, so the rest of the app keeps the tight, enumerated list.
     */
    private function contentSecurityPolicy(Response $response, Request $request): string
    {
        $reverb = config('csp.reverb');
        $reverbOrigin = "{$reverb['scheme']}://{$reverb['host']}:{$reverb['port']}";

        $frameSrc = $request->routeIs('checkout')
            ? "frame-src 'self' https:"
            : "frame-src 'self' https://www.google.com https://sandbox.sslcommerz.com https://securepay.sslcommerz.com https://seamless-epay.sslcommerz.com https://pay.sslcommerz.com https://www.googletagmanager.com";

        // Pulse/Health/Horizon are mother-admin-only ops dashboards (see
        // AdminLayout.tsx, AppServiceProvider's viewPulse/viewHealth gates,
        // HorizonServiceProvider's viewHorizon gate) — not public pages, so
        // relaxing CSP here doesn't expose this to arbitrary visitors.
        // Alpine.js (bundled by Livewire, which both Pulse and Horizon's
        // dashboard rely on) evaluates x-data/@click/x-intersect directive
        // expressions via `new Function()` at runtime — there's no
        // precompiled alternative, so 'unsafe-eval' is a hard requirement,
        // not a preference. Confirmed via real browser console errors
        // (`EvalError: call to Function() blocked by CSP`) on /pulse; every
        // lazy-loaded card's x-intersect="$wire.__lazyLoad(...)" silently
        // never fires without it, which is what actually caused the blank
        // dashboard (not a missing script hash — that part already worked).
        // fonts.bunny.net is Livewire/Horizon's default font host (Bunny
        // Fonts, a Google Fonts alternative) — serves both the CSS and the
        // font files from the same domain, unlike Google's split
        // fonts.googleapis.com/fonts.gstatic.com.
        $isSelfHostedDashboard = $request->routeIs('pulse') || $request->routeIs('health') || $request->routeIs('horizon.*');

        $directives = [
            "default-src 'self'",
            "script-src 'self' 'wasm-unsafe-eval' ".($isSelfHostedDashboard ? "'unsafe-eval' " : '')."{$this->scriptHashes($response)}https://pay.google.com https://sandbox.sslcommerz.com https://securepay.sslcommerz.com https://seamless-epay.sslcommerz.com https://www.googletagmanager.com",
            // Inertia injects the progress-bar/error-modal CSS inline at
            // runtime with no nonce support in the installed package
            // version (added later in the 3.x line) — 'unsafe-inline' here
            // only weakens CSS injection, not script execution.
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com".($isSelfHostedDashboard ? ' https://fonts.bunny.net' : ''),
            "font-src 'self' https://fonts.gstatic.com".($isSelfHostedDashboard ? ' https://fonts.bunny.net' : ''),
            "img-src 'self' data: https:",
            "media-src 'self' https:",
            "connect-src 'self' https://pay.google.com {$reverbOrigin} https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com",
            $frameSrc,
            "form-action 'self' https:",
            "worker-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'self'",
            // Reports every real-world violation (blocked script/frame/connect
            // origin) to CspReportController so we can see exactly which
            // SSLCommerz/bank/payment-method domain needs whitelisting,
            // instead of guessing. Doesn't relax enforcement — the block
            // still happens, this just also logs it.
            'report-uri /csp-report',
        ];

        return implode('; ', $directives);
    }

    /**
     * Hashes every inline `<script>` actually present in the response —
     * Inertia's `<script data-page type="application/json">` payload (fully
     * server-controlled, differs per response) and any static inline
     * scripts in the Blade layout (e.g. the early dark-mode/theme-detection
     * IIFE in app.blade.php). None of these have a nonce hook, so each is
     * allowed via a hash of what was actually rendered rather than
     * 'unsafe-inline'. Scripts with a `src` attribute are external and
     * already covered by `'self'`, so they're excluded from the match.
     */
    private function scriptHashes(Response $response): string
    {
        $content = $response->getContent();

        if (! is_string($content) || ! str_contains((string) $response->headers->get('Content-Type'), 'text/html')) {
            return '';
        }

        // Some vendor dashboards (Horizon's Vue app) inline a full compiled
        // JS bundle — 1MB+ — directly into a <script> tag. PHP's default
        // pcre.backtrack_limit (1,000,000) gets exhausted scanning that much
        // content for the closing tag, which makes preg_match_all() return
        // false (a silent failure, not "0 matches") — the hash list ends up
        // empty and the browser blocks the entire script under CSP. Bump the
        // limit well past any realistic inline script size; ini_set() here
        // only affects this request, not the process-wide default.
        ini_set('pcre.backtrack_limit', '10000000');

        if (! preg_match_all('/<script(?![^>]*\ssrc=)[^>]*>(.*?)<\/script>/s', $content, $matches)) {
            return '';
        }

        $hashes = array_map(
            fn (string $scriptContent) => "'sha256-".base64_encode(hash('sha256', $scriptContent, true))."'",
            $matches[1],
        );

        return implode(' ', $hashes).' ';
    }
}
