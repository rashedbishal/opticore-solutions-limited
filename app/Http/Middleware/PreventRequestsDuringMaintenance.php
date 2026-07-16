<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance as Middleware;

class PreventRequestsDuringMaintenance extends Middleware
{
    /**
     * The URIs that should be reachable while maintenance mode is enabled.
     *
     * `deploy.sh` puts the app into maintenance mode for the duration of the
     * migrate/cache/symlink-swap phases of every deploy. Without this
     * exclusion, an SSLCommerz success redirect or IPN webhook landing in
     * that window would 503 — the customer's payment would go through on
     * SSLCommerz's side, but the app would never process it (no order/task/
     * invoice), since the callback that does that work simply never ran.
     * These routes are excluded so they keep being served by the outgoing
     * release's code, unaffected by the deploy in progress, instead of
     * being blocked outright.
     *
     * @var array<int, string>
     */
    protected $except = [
        '/pay-via-ajax',
        '/success',
        '/fail',
        '/cancel',
        '/ipn',
        '/gpay/charge',
    ];
}
