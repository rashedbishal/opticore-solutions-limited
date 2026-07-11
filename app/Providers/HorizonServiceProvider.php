<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        parent::boot();

        // Horizon::routeSmsNotificationsTo('15556667777');
        // Horizon::routeMailNotificationsTo('example@example.com');
        // Horizon::routeSlackNotificationsTo('slack-webhook-url', '#channel');
    }

    /**
     * Overrides the parent's authorization() (rather than just gate())
     * because the parent's Horizon::auth() callback OR's the gate with
     * `app()->environment('local')` — auto-allowing everyone in local dev
     * regardless of the gate. Mother-admin-only should apply in every
     * environment, matching viewPulse/viewHealth.
     */
    protected function authorization(): void
    {
        $this->gate();

        Horizon::auth(fn ($request) => Gate::check('viewHorizon'));
    }

    /**
     * Register the Horizon gate. Same dual-guard/nullable-$user reasoning
     * as viewPulse/viewHealth (AppServiceProvider) — $user is deliberately
     * unused since it resolves against the default ('web') guard, not the
     * Admin authenticating via the separate 'admin' guard.
     */
    protected function gate(): void
    {
        Gate::define('viewHorizon', fn ($user = null): bool => (bool) auth('admin')->user()?->isMotherAdmin());
    }
}
