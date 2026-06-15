<?php

use App\Models\Admin;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create();

    // The "array" cache store used in tests persists across tests within
    // the same process, but each test's database changes are rolled back.
    // Forget the cached singleton so current() re-reads from this test's
    // transaction instead of returning a stale model from a prior test.
    SiteSetting::forgetCache();
});

it('renders the configuration page with the current settings', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.configuration.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Configuration/Index')
            ->where('settings.contact_email', SiteSetting::defaults()['contact_email'])
            ->where('settings.social_facebook', SiteSetting::defaults()['social_facebook'])
        );
});

it('updates the site configuration and refreshes the cached singleton', function () {
    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.configuration.update'), [
            'contact_email' => 'new-contact@example.com',
            'phone_usa' => '+1 (555) 111-2222',
            'phone_bangladesh' => '+88-01700000000',
            'address_usa' => "New USA Line 1\nNew USA Line 2",
            'address_usa_map_url' => 'https://maps.app.goo.gl/usa-new',
            'address_bangladesh' => "New BD Line 1\nNew BD Line 2",
            'address_bangladesh_map_url' => 'https://maps.app.goo.gl/bd-new',
            'social_facebook' => 'https://www.facebook.com/new-page',
            'social_x' => '',
            'social_instagram' => '',
            'social_linkedin' => '',
            'social_youtube' => '',
            'social_behance' => '',
            'social_pinterest' => '',
            'social_tiktok' => '',
        ])
        ->assertRedirect(route('admin.configuration.index'));

    $this->assertDatabaseHas('site_settings', [
        'contact_email' => 'new-contact@example.com',
        'phone_usa' => '+1 (555) 111-2222',
        'phone_bangladesh' => '+88-01700000000',
        'address_usa' => "New USA Line 1\nNew USA Line 2",
        'address_usa_map_url' => 'https://maps.app.goo.gl/usa-new',
        'address_bangladesh' => "New BD Line 1\nNew BD Line 2",
        'address_bangladesh_map_url' => 'https://maps.app.goo.gl/bd-new',
        'social_facebook' => 'https://www.facebook.com/new-page',
        'social_x' => null,
        'social_instagram' => null,
    ]);

    $public = SiteSetting::current()->toPublicArray();

    expect($public['email'])->toBe('new-contact@example.com');
    expect($public['phoneBangladeshLink'])->toBe('tel:+8801700000000');
    expect($public['socialFacebook'])->toBe('https://www.facebook.com/new-page');
    expect($public['socialX'])->toBeNull();
});

it('rejects invalid email and url values', function () {
    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.configuration.update'), [
            'contact_email' => 'not-an-email',
            'social_facebook' => 'not-a-url',
            'address_usa_map_url' => 'not-a-url',
        ])
        ->assertInvalid(['contact_email', 'social_facebook', 'address_usa_map_url']);
});

it('blocks a regular admin without the configuration permission', function () {
    $admin = Admin::factory()->regular()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.configuration.index'))
        ->assertForbidden();

    $this->actingAs($admin, 'admin')
        ->put(route('admin.configuration.update'), [])
        ->assertForbidden();
});

it('allows a regular admin granted the configuration permission', function () {
    $admin = Admin::factory()->withPermissions(['configuration'])->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.configuration.index'))
        ->assertSuccessful();

    $this->actingAs($admin, 'admin')
        ->put(route('admin.configuration.update'), [
            'contact_email' => 'allowed@example.com',
        ])
        ->assertRedirect(route('admin.configuration.index'));

    expect(SiteSetting::current()->contact_email)->toBe('allowed@example.com');
});

it('blocks guests from configuration routes', function () {
    $this->get(route('admin.configuration.index'))->assertRedirect(route('admin.login'));
    $this->put(route('admin.configuration.update'), [])->assertRedirect(route('admin.login'));
});

it('shares site settings with the homepage and contact page', function () {
    SiteSetting::current()->update([
        'contact_email' => 'shared@example.com',
        'social_facebook' => 'https://www.facebook.com/shared-page',
        'social_x' => null,
    ]);
    SiteSetting::forgetCache();

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('siteSettings.email', 'shared@example.com')
            ->where('siteSettings.socialFacebook', 'https://www.facebook.com/shared-page')
            ->where('siteSettings.socialX', null)
        );

    $this->get(route('contact'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('siteSettings.email', 'shared@example.com')
        );
});

it('caches a plain attribute array that survives serialization on non-array stores', function () {
    SiteSetting::forgetCache();
    SiteSetting::current();

    $cached = Cache::get(SiteSetting::CACHE_KEY);

    expect($cached)->toBeArray();

    // Simulate a database/redis/file cache store, which serializes values.
    $roundTripped = unserialize(serialize($cached));
    $model = (new SiteSetting)->newFromBuilder($roundTripped);

    expect($model)->toBeInstanceOf(SiteSetting::class);
    expect($model->exists)->toBeTrue();
    expect($model->contact_email)->toBe(SiteSetting::defaults()['contact_email']);
});
