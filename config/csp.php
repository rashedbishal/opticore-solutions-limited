<?php

// The browser connects to Reverb using the VITE_-prefixed values baked into
// the frontend bundle at build time, which can differ from the server-side
// REVERB_* values (e.g. behind a reverse proxy). The CSP connect-src needs
// to match what the browser actually dials, so it's derived from those.
return [
    'reverb' => [
        'scheme' => env('VITE_REVERB_SCHEME', 'https') === 'https' ? 'wss' : 'ws',
        'host' => env('VITE_REVERB_HOST', '127.0.0.1'),
        'port' => env('VITE_REVERB_PORT', 8080),
    ],
];
