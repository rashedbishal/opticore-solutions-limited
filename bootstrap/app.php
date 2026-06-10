<?php

use App\Http\Middleware\EnsureAdminHasPermission;
use App\Http\Middleware\EnsureAdminSessionIsCurrent;
use App\Http\Middleware\HandleInertiaRequests;
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
        // Trust all proxies so nginx-terminated TLS is recognised correctly.
        // Without this, Laravel sees HTTP instead of HTTPS, session/cookie
        // Secure flags are wrong, and broadcast channel auth returns 403.
        $middleware->trustProxies(at: '*');

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
    })->create();
