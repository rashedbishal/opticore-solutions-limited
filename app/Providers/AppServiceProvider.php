<?php

namespace App\Providers;

use App\Leads\Listeners\BroadcastAdminNotification;
use App\Leads\Mail\ImapClient;
use App\Leads\Mail\NativeImapClient;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Spatie\Health\Checks\Checks\CacheCheck;
use Spatie\Health\Checks\Checks\DatabaseCheck;
use Spatie\Health\Checks\Checks\DebugModeCheck;
use Spatie\Health\Checks\Checks\OptimizedAppCheck;
use Spatie\Health\Checks\Checks\ScheduleCheck;
use Spatie\Health\Checks\Checks\UsedDiskSpaceCheck;
use Spatie\Health\Facades\Health;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Email lead inboxes read through PHP's imap extension.
        $this->app->bind(ImapClient::class, NativeImapClient::class);
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiters();

        Gate::define('access-admin', function (User $user) {
            return $user->role === 'admin';
        });

        // Pulse's Authorize middleware checks this gate. Deliberately ignore
        // the injected $user — it resolves against the default ('web') guard,
        // which is the customer User model here, not the Admin that
        // authenticates via the separate 'admin' guard — and restrict the
        // dashboard (request timings, exceptions, slow queries, per-user
        // activity) to the mother admin only, rather than adding it as a
        // delegable AdminPermissions key.
        //
        // The `$user = null` param is required, not decorative: Gate::raw()
        // resolves "$user" from the *default* guard before invoking this
        // closure, and when that's null (true here, since admins never
        // authenticate on the default guard) it only invokes closures whose
        // first parameter is nullable/defaults to null — i.e. explicitly
        // "allows guests". A zero-arg closure gets silently swapped for a
        // no-op deny callback without ever running, no matter what it
        // would've returned.
        Gate::define('viewPulse', fn ($user = null): bool => (bool) auth('admin')->user()?->isMotherAdmin());

        // Same dual-guard/nullable-$user reasoning as viewPulse above —
        // restricts /health to the mother admin only.
        Gate::define('viewHealth', fn ($user = null): bool => (bool) auth('admin')->user()?->isMotherAdmin());

        $this->configureHealthChecks();

        // Lead alerts bell: listeners under app/Leads aren't auto-discovered
        // (discovery only scans app/Listeners), so register it explicitly.
        Event::listen(NotificationSent::class, BroadcastAdminNotification::class);
    }

    /**
     * Register Spatie Health's checks. ScheduleCheck relies on
     * ScheduleCheckHeartbeatCommand being scheduled every minute (see
     * bootstrap/app.php) — without it, it always reports "did not run yet".
     */
    protected function configureHealthChecks(): void
    {
        Health::checks([
            DatabaseCheck::new()->connectionName('pgsql')->name('Database (client)'),
            DatabaseCheck::new()->connectionName('admin')->name('Database (admin)'),
            DatabaseCheck::new()->connectionName('meal')->name('Database (meal)'),
            CacheCheck::new(),
            UsedDiskSpaceCheck::new(),
            ScheduleCheck::new(),
            DebugModeCheck::new(),
            OptimizedAppCheck::new(),
        ]);
    }

    /**
     * Register named rate limiters for authentication routes.
     *
     * - login / admin-login: keyed by email + IP so each account has its own
     *   independent counter and a shared IP cannot lock out other accounts.
     *   Each also adds a second, IP-less cap on the account alone, so an
     *   attacker rotating source IPs to brute-force one target account
     *   can't get a fresh allowance from every new IP.
     * - register: keyed by IP only since no account exists yet.
     * - password-reset: keyed by email + IP (stop repeated resets aimed at
     *   one target), capped per IP alone (stop one IP rotating through many
     *   target emails to enumerate accounts or mass-spam reset emails), and
     *   capped per email alone (stop IP-rotation email-bombing one target).
     * - payment-callback: SSLCommerz's redirect/IPN endpoints can't require
     *   auth or carry a CSRF token, so they're public by necessity. The
     *   limit is deliberately generous (real traffic per checkout is a
     *   handful of requests) — it only exists to bound outright flooding,
     *   never to risk dropping a legitimate gateway callback or IPN retry.
     */
    protected function configureRateLimiters(): void
    {
        // Lead webhooks from Meta: generous per IP (Meta batches and retries),
        // but bounded so a flood can't tie up the app.
        RateLimiter::for('lead-call-actions', fn (Request $request) => Limit::perMinute(60)->by('lead-call:'.($request->user('admin')?->getAuthIdentifier() ?? $request->ip())));
        RateLimiter::for('lead-webhooks', fn (Request $request) => Limit::perMinute(600)->by($request->ip()));

        RateLimiter::for('login', function (Request $request) {
            $email = Str::lower($request->string('email'));

            return [
                Limit::perMinute(5)->by($email.'|'.$request->ip()),
                Limit::perHour(10)->by('account:'.$email),
            ];
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('admin-login', function (Request $request) {
            $email = Str::lower($request->string('email'));

            return [
                Limit::perMinute(3)->by($email.'|'.$request->ip()),
                Limit::perHour(8)->by('account:'.$email),
            ];
        });

        RateLimiter::for('password-reset', function (Request $request) {
            $email = Str::lower($request->string('email'));

            return [
                Limit::perMinute(3)->by($email.'|'.$request->ip()),
                Limit::perMinute(10)->by($request->ip()),
                Limit::perHour(8)->by('account:'.$email),
            ];
        });

        RateLimiter::for('payment-callback', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        // Authenticated user↔admin conversation chat.
        // Keyed by user ID rather than IP — these routes are behind `auth`,
        // so the user is always resolved, and per-user caps are fairer than
        // per-IP caps on shared networks (e.g. a company using a single NAT).
        //
        // user-chat-message: send-message endpoint — 20/min is comfortable
        //   for real conversation but blocks any flood attempt.
        // user-chat-presence: background heartbeat calls (ping, offline, read,
        //   init, messages fetch) — 30/min allows normal polling cadence (~1
        //   ping per 30 s = 2/min) with headroom for rapid UI interactions.
        RateLimiter::for('subscription', function (Request $request) {
            $email = Str::lower($request->string('email'));

            return [
                Limit::perMinute(3)->by($request->ip()),
                Limit::perHour(2)->by('subscription:'.$email),
            ];
        });

        RateLimiter::for('user-chat-message', function (Request $request) {
            return Limit::perMinute(20)->by('ucm:'.$request->user()?->getAuthIdentifier());
        });

        RateLimiter::for('user-chat-presence', function (Request $request) {
            return Limit::perMinute(30)->by('ucp:'.$request->user()?->getAuthIdentifier());
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        // Shared by every password-setting flow — registration, self-service
        // reset, profile updates, and the mother-admin break-glass command —
        // via Password::defaults(). Update this one place, not each call site.
        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(8)
                ->letters()
                ->numbers()
                ->mixedCase()
                ->symbols()
            : null,
        );

        // Symfony already marks the cookie secure when it detects an HTTPS
        // request (relying on the trusted X-Forwarded-Proto header from the
        // proxy), but that's silent and depends on perfect proxy config.
        // Force it explicitly in production so a misconfigured/missing
        // forwarded-proto header can never silently downgrade the cookie.
        if (app()->isProduction()) {
            config(['session.secure' => true]);
        }
    }
}
