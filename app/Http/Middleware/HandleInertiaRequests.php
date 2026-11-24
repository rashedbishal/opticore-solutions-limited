<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Category;
use App\Models\SiteSetting;
use App\Support\AdminSections;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Routes excluded from SSR: authenticated/transactional areas (admin
     * panel, dashboard, checkout, offers, customer chat) that are behind
     * auth and haven't been audited for server-render safety (live chat
     * state, payment widgets, etc.). Public marketing pages stay SSR'd.
     *
     * @var array<int, string>
     */
    protected $withoutSsr = [
        'admin/*',
        'dashboard',
        'profile',
        'checkout',
        'checkout/*',
        'gpay/*',
        'offer/*',
        'orders/*',
    ];

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'invoice' => fn () => $request->session()->get('invoice'),
                // pull(), not get(): this is meant to be shown exactly once. Relying
                // on Laravel's implicit two-request flash aging instead would leave
                // it resurfaceable by anything that reflashes/keeps session data.
                'payment_success' => fn () => $request->session()->pull('payment_success'),
                'payment_error' => fn () => $request->session()->get('payment_error'),
                'checkout_url' => fn () => $request->session()->get('checkout_url'),
                'subscription' => fn () => $request->session()->get('subscription'),
            ],
            'auth' => [
                'user' => $request->user(),
            ],
            // Sections (and their usable modules) for the logged-in admin; drives
            // the grouped CMS sidebar. Null everywhere else.
            'adminSections' => function () {
                $admin = auth('admin')->user();

                return $admin instanceof Admin ? AdminSections::forAdmin($admin) : null;
            },
            'categories' => fn () => Category::configShape(),
            'footerServices' => fn () => Category::servicePageLinks(),
            'siteSettings' => fn () => SiteSetting::current()->toPublicArray(),
        ];
    }
}
