<?php

// SSLCommerz configuration

$apiDomain = env('SSLCZ_TESTMODE') ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';

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
