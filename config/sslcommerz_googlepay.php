<?php

// SSLCommerz "Merchant Hosted Payment API" configuration, used only for the
// Google Pay integration. Kept fully separate from config/sslcommerz.php
// (the classic Easy Checkout integration) — store credentials are read from
// that existing config rather than redeclared here, so there's a single
// source of truth for them.

return [
    // UNCONFIRMED — these were a best guess (same domains as the classic
    // Easy Checkout API) and have been verified WRONG by direct request
    // (404 on sandbox). SSLCommerz's own docs don't publish a real value for
    // this; it has to come from their team directly. Update this once they
    // reply with the real base URL for the Merchant Hosted Payment API.
    'base_url' => env('SSLCZ_TESTMODE')
        ? 'https://sandbox.sslcommerz.com'
        : 'https://securepay.sslcommerz.com',

    'endpoint' => '/api/v1/merchant-hosted-payment',

    'environment' => env('SSLCZ_TESTMODE') ? 'TEST' : 'PRODUCTION',
];
