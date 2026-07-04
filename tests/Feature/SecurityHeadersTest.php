<?php

it('always sets the baseline security headers', function () {
    $this->get('/')
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
});

it('does not send a CSP or HSTS header outside production', function () {
    $response = $this->get('/');

    expect($response->headers->has('Content-Security-Policy'))->toBeFalse();
    expect($response->headers->has('Strict-Transport-Security'))->toBeFalse();
});

it('sends a CSP and HSTS header in production that allowlists every required integration', function () {
    app()->instance('env', 'production');

    try {
        $response = $this->get('/');
    } finally {
        app()->instance('env', 'testing');
    }

    $response->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    $csp = $response->headers->get('Content-Security-Policy');

    expect($csp)->not->toBeNull();
    expect($csp)->toContain("default-src 'self'");
    expect($csp)->toContain('https://pay.google.com');
    expect($csp)->toContain('https://sandbox.sslcommerz.com');
    expect($csp)->toContain('https://securepay.sslcommerz.com');
    // Live (non-sandbox) SSLCommerz embedded-checkout traffic spans two
    // more domains than the API/sandbox ones: seamless-epay.sslcommerz.com
    // serves the embed.min.js bootstrap script, and pay.sslcommerz.com is
    // the actual payment-form iframe it opens. Missing either blocks the
    // live payment popup in production only, since CSP is disabled locally
    // — and sandbox-mode testing never exercises either domain.
    expect($csp)->toContain('https://seamless-epay.sslcommerz.com');
    expect($csp)->toContain('https://pay.sslcommerz.com');
    expect($csp)->toContain('https://fonts.googleapis.com');
    expect($csp)->toContain('https://www.google.com');
    expect($csp)->toContain("object-src 'none'");
    expect($csp)->toContain("frame-ancestors 'self'");
});

it('allows the Inertia data-page script via a hash computed from the actual response body', function () {
    app()->instance('env', 'production');

    try {
        $response = $this->get('/');
    } finally {
        app()->instance('env', 'testing');
    }

    $content = $response->getContent();
    preg_match('/<script data-page="[^"]*" type="application\/json">(.*?)<\/script>/s', $content, $matches);

    expect($matches)->toHaveCount(2);

    $expectedHash = "'sha256-".base64_encode(hash('sha256', $matches[1], true))."'";

    expect($response->headers->get('Content-Security-Policy'))->toContain($expectedHash);
});

it('allows every inline script in the response, not just the Inertia data-page payload', function () {
    app()->instance('env', 'production');

    try {
        $response = $this->get('/');
    } finally {
        app()->instance('env', 'testing');
    }

    $content = $response->getContent();
    preg_match_all('/<script(?![^>]*\ssrc=)[^>]*>(.*?)<\/script>/s', $content, $matches);

    // At minimum: the Inertia data-page payload, the theme-detection IIFE,
    // and the Roboto Mono font-swap script in app.blade.php (Laravel Boost
    // may also inject its own dev-only browser-logger script, so this isn't
    // pinned to an exact count) — if this drops below 3, a real inline
    // script regressed to needing 'unsafe-inline' or got silently dropped.
    expect(count($matches[1]))->toBeGreaterThanOrEqual(3);

    $csp = $response->headers->get('Content-Security-Policy');

    foreach ($matches[1] as $scriptContent) {
        $expectedHash = "'sha256-".base64_encode(hash('sha256', $scriptContent, true))."'";

        expect($csp)->toContain($expectedHash);
    }
});
