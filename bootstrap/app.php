<?php

use App\Console\Commands\AutoDeclineMealSelections;
use App\Console\Commands\PruneOrphanedCheckoutUploads;
use App\Console\Commands\WarmCache;
use App\Http\Middleware\AuthenticateCallingAppDevice;
use App\Http\Middleware\EnsureAdminHasPermission;
use App\Http\Middleware\EnsureAdminSessionIsCurrent;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\VerifyMetaWebhookSignature;
use App\Leads\Console\Commands\CheckMetaTokens;
use App\Leads\Console\Commands\CleanupOrphanedLeadAttachments;
use App\Leads\Console\Commands\DetectLeadDuplicates;
use App\Leads\Console\Commands\FetchEmailLeads;
use App\Leads\Console\Commands\FetchFacebookLeadTest;
use App\Leads\Console\Commands\NurtureInactiveLeads;
use App\Leads\Console\Commands\RecalculateLeadScores;
use App\Leads\Console\Commands\ReconcileStaleLeadCalls;
use App\Leads\Console\Commands\RetryFailedEmailMessages;
use App\Leads\Console\Commands\SendLeadAlertNotifications;
use App\Leads\Console\Commands\SendTaskAlertNotifications;
use App\Leads\Console\Commands\SubscribeLeadgenWebhook;
use App\Leads\Support\LeadClock;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Sentry\Laravel\Integration;
use Spatie\Health\Commands\RunHealthChecksCommand;
use Spatie\Health\Commands\ScheduleCheckHeartbeatCommand;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
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
            'csp-report',
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SecurityHeaders::class,
        ]);

        $middleware->alias([
            'admin.permission' => EnsureAdminHasPermission::class,
            'verify.meta.signature' => VerifyMetaWebhookSignature::class,
            'calling-app.device' => AuthenticateCallingAppDevice::class,
            'admin.session' => EnsureAdminSessionIsCurrent::class,
        ]);

        $middleware->redirectTo(
            guests: fn (Request $request) => $request->is('admin*') ? route('admin.login') : '/login',
            users: fn (Request $request) => $request->is('admin*') ? route('admin.dashboard') : route('home'),
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);

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
    // Lead Management commands live in app/Leads, outside the
    // auto-discovered app/Console/Commands folder.
    ->withCommands([
        SendLeadAlertNotifications::class,
        CheckMetaTokens::class,
        SubscribeLeadgenWebhook::class,
        FetchFacebookLeadTest::class,
        FetchEmailLeads::class,
        RetryFailedEmailMessages::class,
        CleanupOrphanedLeadAttachments::class,
        SendTaskAlertNotifications::class,
        DetectLeadDuplicates::class,
        RecalculateLeadScores::class,
        NurtureInactiveLeads::class,
        ReconcileStaleLeadCalls::class,
    ])
    ->withSchedule(function (Schedule $schedule): void {
        // Re-prime all public-facing Redis caches every 50 minutes so the
        // 60-minute TTL never cold-misses in production (first request after
        // expiry would otherwise hit the DB directly and spike TTFB).
        // everyFiftyMinutes() isn't a real Schedule method (Laravel has no
        // built-in helper for non-hour-dividing intervals) — ->cron() is
        // the primitive every named frequency helper is built on, so this
        // runs at :00 and :50 past the hour, keeping the gap since the last
        // refresh at or under 50 minutes, safely inside the 60-minute TTL.
        $schedule->command(WarmCache::class)->cron('*/50 * * * *')->withoutOverlapping();

        // Clean up files pre-uploaded at checkout but never paid for
        // (user abandoned mid-flow or refreshed before clicking Pay Now).
        // everyTwentyMinutes() isn't real either; 20 evenly divides 60, so
        // this cron expression is a true, evenly-spaced every-20-minutes.
        $schedule->command(PruneOrphanedCheckoutUploads::class)->cron('*/20 * * * *');

        // Mother admin sets the daily lock time once and it applies every
        // day thereafter, so there's no fixed cron time to hang this off —
        // it has to poll. withoutOverlapping guards against a slow run
        // overlapping the next minute's tick; the command itself is
        // idempotent (only inserts rows for admins still missing one).
        $schedule->command(AutoDeclineMealSelections::class)->everyMinute()->withoutOverlapping();

        // Writes a fresh heartbeat timestamp every tick; Spatie Health's
        // ScheduleCheck (config: app/Providers/AppServiceProvider.php)
        // compares against it to detect the scheduler itself silently
        // dying — e.g. if the VPS's `* * * * * php artisan schedule:run`
        // crontab entry ever gets removed, nothing else here would notice.
        $schedule->command(ScheduleCheckHeartbeatCommand::class)->everyMinute();

        // Actually runs the checks and stores results for the /health
        // dashboard to display — the heartbeat above only feeds the
        // Schedule check, it doesn't run the checks themselves. Without
        // this, latestResults() stays null forever and the dashboard shows
        // nothing.
        $schedule->command(RunHealthChecksCommand::class)->everyMinute()->withoutOverlapping();

        // Lead Management: daily bell alerts for leads whose meeting or
        // follow-up reminder is showing (no-op while reminders are off).
        $schedule->command(SendLeadAlertNotifications::class)->dailyAt('08:00')->timezone(LeadClock::TIMEZONE);
        $schedule->command(SendTaskAlertNotifications::class)->dailyAt('08:00')->timezone(LeadClock::TIMEZONE);
        $schedule->command(DetectLeadDuplicates::class)->dailyAt('02:30')->timezone(LeadClock::TIMEZONE)->withoutOverlapping();
        $schedule->command(RecalculateLeadScores::class)->dailyAt('03:00')->timezone(LeadClock::TIMEZONE)->withoutOverlapping();
        $schedule->command(ReconcileStaleLeadCalls::class)->everyMinute()->withoutOverlapping(10);
        $schedule->command(NurtureInactiveLeads::class)->dailyAt('08:00')->timezone(LeadClock::TIMEZONE)->withoutOverlapping();

        // Daily read-only check of every Meta channel key (health warnings).
        $schedule->command(CheckMetaTokens::class)->dailyAt('03:00')->timezone(LeadClock::TIMEZONE)->withoutOverlapping();

        // Email lead inboxes: queue due inbox checks, retry failed emails,
        // and remove attachment files whose lead was deleted.
        $schedule->command(FetchEmailLeads::class)->everyMinute()->withoutOverlapping();
        $schedule->command(RetryFailedEmailMessages::class)->everyFifteenMinutes()->withoutOverlapping();
        $schedule->command(CleanupOrphanedLeadAttachments::class)->dailyAt('04:00')->timezone(LeadClock::TIMEZONE)->withoutOverlapping();
    })
    ->create();
