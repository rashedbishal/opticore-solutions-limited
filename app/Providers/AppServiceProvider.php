<?php

namespace App\Providers;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
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

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(8)
                ->letters()
                ->numbers()
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
