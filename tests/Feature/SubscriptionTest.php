<?php

use App\Mail\ConfirmSubscriptionMail;
use App\Mail\ConfirmUnsubscribeMail;
use App\Mail\ManageSubscriptionFromProfileMail;
use App\Models\Admin;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

it('emails a confirmation link instead of subscribing a guest immediately', function () {
    Mail::fake();

    $this->postJson(route('subscription.subscribe'), ['email' => 'guest@example.com'])
        ->assertOk()
        ->assertJson(['status' => 'pending']);

    expect(Subscription::where('email', 'guest@example.com')->exists())->toBeFalse();
    Mail::assertQueued(ConfirmSubscriptionMail::class);
});

it('emails a confirmation link instead of unsubscribing a guest immediately', function () {
    Subscription::create(['email' => 'guest@example.com']);
    Mail::fake();

    $this->postJson(route('subscription.unsubscribe'), ['email' => 'guest@example.com'])
        ->assertOk()
        ->assertJson(['status' => 'pending']);

    expect(Subscription::where('email', 'guest@example.com')->exists())->toBeTrue();
    Mail::assertQueued(ConfirmUnsubscribeMail::class);
});

it('subscribes a guest once their emailed confirmation link is visited', function () {
    $url = URL::temporarySignedRoute(
        'subscription.confirm-subscribe',
        now()->addHours(24),
        ['email' => 'guest@example.com'],
    );

    $this->get($url)->assertRedirect('/');

    expect(Subscription::where('email', 'guest@example.com')->exists())->toBeTrue();
});

it('unsubscribes a guest once their emailed confirmation link is visited', function () {
    Subscription::create(['email' => 'guest@example.com']);

    $url = URL::temporarySignedRoute(
        'subscription.confirm-unsubscribe',
        now()->addHours(24),
        ['email' => 'guest@example.com'],
    );

    $this->get($url)->assertRedirect('/');

    expect(Subscription::where('email', 'guest@example.com')->exists())->toBeFalse();
});

it('rejects a confirmation link whose email was tampered with after signing', function () {
    $url = URL::temporarySignedRoute(
        'subscription.confirm-subscribe',
        now()->addHours(24),
        ['email' => 'guest@example.com'],
    );

    // The email appears URL-encoded (guest%40example.com) — swap just the
    // local part so the replacement survives encoding.
    $tamperedUrl = str_replace('guest', 'victim', $url);

    $this->get($tamperedUrl)->assertForbidden();

    expect(Subscription::where('email', 'victim@example.com')->exists())->toBeFalse();
});

it('never subscribes a registered client directly from the public form', function () {
    Mail::fake();
    $user = User::factory()->create(['email' => 'client@example.com']);

    $this->postJson(route('subscription.subscribe'), ['email' => 'client@example.com'])
        ->assertOk()
        ->assertJson(['status' => 'pending']);

    expect($user->refresh()->notify_promotional_emails)->toBeFalse();
    expect(Subscription::where('email', 'client@example.com')->exists())->toBeFalse();
    Mail::assertQueued(ManageSubscriptionFromProfileMail::class);
    Mail::assertNotQueued(ConfirmSubscriptionMail::class);
});

it('never unsubscribes a registered client directly from the public form', function () {
    Mail::fake();
    $user = User::factory()->create([
        'email' => 'client@example.com',
        'notify_promotional_emails' => true,
    ]);
    Subscription::create(['email' => 'client@example.com']);

    $this->postJson(route('subscription.unsubscribe'), ['email' => 'client@example.com'])
        ->assertOk()
        ->assertJson(['status' => 'pending']);

    expect($user->refresh()->notify_promotional_emails)->toBeTrue();
    expect(Subscription::where('email', 'client@example.com')->exists())->toBeTrue();
    Mail::assertQueued(ManageSubscriptionFromProfileMail::class);
    Mail::assertNotQueued(ConfirmUnsubscribeMail::class);
});

it('turns on a matching registered user\'s promotional emails preference when their confirmation link is visited', function () {
    $user = User::factory()->create(['email' => 'client@example.com']);

    $url = URL::temporarySignedRoute(
        'subscription.confirm-subscribe',
        now()->addHours(24),
        ['email' => 'client@example.com'],
    );

    $this->get($url)->assertRedirect('/');

    expect($user->refresh()->notify_promotional_emails)->toBeTrue();
});

it('turns off a matching registered user\'s promotional emails preference when an admin removes the subscriber', function () {
    $admin = Admin::factory()->create();
    $user = User::factory()->create([
        'email' => 'client@example.com',
        'notify_promotional_emails' => true,
    ]);
    $subscription = Subscription::create(['email' => 'client@example.com']);

    $this->actingAs($admin, 'admin')
        ->delete(route('admin.subscriptions.destroy', $subscription))
        ->assertRedirect();

    expect($user->refresh()->notify_promotional_emails)->toBeFalse();
    expect(Subscription::where('email', 'client@example.com')->exists())->toBeFalse();
});

it('blocks a regular admin without the subscriptions permission from viewing or removing subscribers', function () {
    $admin = Admin::factory()->regular()->create();
    $subscription = Subscription::create(['email' => 'guarded@example.com']);

    $this->actingAs($admin, 'admin')
        ->get(route('admin.subscriptions.index'))
        ->assertForbidden();

    $this->actingAs($admin, 'admin')
        ->delete(route('admin.subscriptions.destroy', $subscription))
        ->assertForbidden();

    expect(Subscription::where('email', 'guarded@example.com')->exists())->toBeTrue();
});

it('allows a regular admin with the subscriptions permission to view and remove subscribers', function () {
    $admin = Admin::factory()->withPermissions(['subscriptions'])->create();
    $subscription = Subscription::create(['email' => 'allowed@example.com']);

    $this->actingAs($admin, 'admin')
        ->get(route('admin.subscriptions.index'))
        ->assertSuccessful();

    $this->actingAs($admin, 'admin')
        ->delete(route('admin.subscriptions.destroy', $subscription))
        ->assertRedirect();

    expect(Subscription::where('email', 'allowed@example.com')->exists())->toBeFalse();
});
