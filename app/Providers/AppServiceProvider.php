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
     * - register: keyed by IP only since no account exists yet.
     */
    protected function configureRateLimiters(): void
    {
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by(
                Str::lower($request->string('email')).'|'.$request->ip()
            );
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('admin-login', function (Request $request) {
            return Limit::perMinute(3)->by(
                Str::lower($request->string('email')).'|'.$request->ip()
            );
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
    }
}
