<?php

// SSLCommerz configuration

$apiDomain = env('SSLCZ_TESTMODE') ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';

// Per SSLCommerz's docs, the embed.min.js *widget* script (loaded client-side
// to open the gateway popup) lives on a different domain than the API domain
// above once you go live — sandbox.sslcommerz.com for both, but live widget
// traffic is served from seamless-epay.sslcommerz.com, not securepay.
$embedScriptDomain = env('SSLCZ_TESTMODE') ? 'https://sandbox.sslcommerz.com' : 'https://seamless-epay.sslcommerz.com';

return [
    'apiCredentials' => [
        'store_id' => env('SSLCZ_STORE_ID'),
        'store_password' => env('SSLCZ_STORE_PASSWORD'),
    ],
    'apiUrl' => [
        'make_payment' => '/gwprocess/v4/api.php',
        'transaction_status' => '/validator/api/merchantTransIDvalidationAPI.php',
        'order_validate' => '/validator/api/validationserverAPI.php',
        'refund_payment' => '/validator/api/merchantTransIDvalidationAPI.php',
        'refund_status' => '/validator/api/merchantTransIDvalidationAPI.php',
    ],
    'apiDomain' => $apiDomain,
    'embedScriptUrl' => $embedScriptDomain.'/embed.min.js',
    // Requires APP_ENV=local in addition to IS_LOCALHOST, so a stray
    // IS_LOCALHOST=true left in a deployed .env can't disable TLS
    // verification in production. Uses env() rather than app()->environment()
    // because config files load before the container's environment binding
    // exists.
    'connect_from_localhost' => env('APP_ENV') === 'local' && env('IS_LOCALHOST', false),
    'success_url' => '/success',
    'failed_url' => '/fail',
    'cancel_url' => '/cancel',
    'ipn_url' => '/ipn',
];
