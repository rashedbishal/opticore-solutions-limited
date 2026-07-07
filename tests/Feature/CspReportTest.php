<?php

use Illuminate\Support\Facades\Log;

it('accepts a CSP violation report without a CSRF token and returns 204', function () {
    $payload = [
        'csp-report' => [
            'document-uri' => 'https://example.test/',
            'violated-directive' => "script-src 'self'",
            'blocked-uri' => 'https://evil.test/script.js',
        ],
    ];

    Log::spy();

    $this->call('POST', route('csp.report'), server: [
        'CONTENT_TYPE' => 'application/csp-report',
    ], content: json_encode($payload))
        ->assertNoContent();

    Log::shouldHaveReceived('warning')
        ->once()
        ->with('CSP violation', $payload);
});

it('does not error on a malformed, non-JSON report body', function () {
    $this->call('POST', route('csp.report'), server: [
        'CONTENT_TYPE' => 'application/csp-report',
    ], content: 'not json at all')
        ->assertNoContent();
});

it('throttles repeated CSP reports', function () {
    for ($i = 0; $i < 30; $i++) {
        $this->post(route('csp.report'), [])->assertNoContent();
    }

    $this->post(route('csp.report'), [])->assertStatus(429);
});
