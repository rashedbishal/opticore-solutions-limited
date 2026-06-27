<?php

use App\Console\Commands\PruneOrphanedCheckoutUploads;
use App\Http\Middleware\EnsureAdminHasPermission;
use App\Http\Middleware\EnsureAdminSessionIsCurrent;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        channels: __DIR__.'/../routes/channels.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust the proxy (nginx) for scheme/host/port so TLS termination is
        // recognised correctly — without this, Laravel sees HTTP instead of
        // HTTPS, session/cookie Secure flags are wrong, and broadcast channel
        // auth returns 403. Deliberately not trusting X-Forwarded-For: under
        // `at: '*'`, Laravel trusts whichever IP is currently REMOTE_ADDR as
        // "the proxy" on every request, which lets a client's own forged
        // X-Forwarded-For header override $request->ip() and bypass the IP
        // half of every rate limiter. REMOTE_ADDR is already the real client
        // IP here (nginx sets it via the FastCGI REMOTE_ADDR param), so
        // dropping X-Forwarded-For from the trusted set keeps IP-based
        // limiters accurate without affecting TLS/scheme detection.
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
                | Request::HEADER_X_FORWARDED_PREFIX
                | Request::HEADER_X_FORWARDED_AWS_ELB,
        );

        // Exclude the broadcasting auth endpoint from CSRF so the Pusher.js
        // authorizer (which sends JSON, not a form) is never blocked by CSRF.
        $middleware->validateCsrfTokens(except: [
            'broadcasting/auth',
            'success',
            'fail',
            'cancel',
            'ipn',
            'pay-via-ajax',
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SecurityHeaders::class,
        ]);

        $middleware->alias([
            'admin.permission' => EnsureAdminHasPermission::class,
            'admin.session' => EnsureAdminSessionIsCurrent::class,
        ]);

        $middleware->redirectTo(
            guests: fn (Request $request) => $request->is('admin*') ? route('admin.login') : '/login',
            users: fn (Request $request) => $request->is('admin*') ? route('admin.dashboard') : route('home'),
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if ($exception instanceof HttpExceptionInterface && in_array($exception->getStatusCode(), [403, 404, 429, 500, 503])) {
                return Inertia::render('Error', [
                    'status' => $exception->getStatusCode(),
                    'message' => $exception->getMessage() ?: null,
                ])
                    ->toResponse($request)
                    ->setStatusCode($exception->getStatusCode());
            }

            return $response;
        });
    })
    ->withSchedule(function (Schedule $schedule): void {
        // Clean up files pre-uploaded at checkout but never paid for
        // (user abandoned mid-flow or refreshed before clicking Pay Now).
        $schedule->command(PruneOrphanedCheckoutUploads::class)->everyTwentyMinutes();
    })
    ->create();
