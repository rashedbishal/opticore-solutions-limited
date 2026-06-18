<?php

use App\Models\Admin;
use App\Models\Subscription;
use App\Models\User;

it('allows a guest to subscribe to the newsletter', function () {
    $this->postJson(route('subscription.subscribe'), ['email' => 'guest@example.com'])
        ->assertOk()
        ->assertJson(['subscribed' => true]);

    expect(Subscription::where('email', 'guest@example.com')->exists())->toBeTrue();
});

it('allows a guest to unsubscribe from the newsletter', function () {
    Subscription::create(['email' => 'guest@example.com']);

    $this->postJson(route('subscription.unsubscribe'), ['email' => 'guest@example.com'])
        ->assertOk()
        ->assertJson(['subscribed' => false]);

    expect(Subscription::where('email', 'guest@example.com')->exists())->toBeFalse();
});

it('turns on a matching registered user\'s promotional emails preference when subscribing via the footer', function () {
    $user = User::factory()->create(['email' => 'client@example.com']);

    expect($user->refresh()->notify_promotional_emails)->toBeFalse();

    $this->postJson(route('subscription.subscribe'), ['email' => 'client@example.com'])
        ->assertOk();

    expect($user->refresh()->notify_promotional_emails)->toBeTrue();
});

it('turns off a matching registered user\'s promotional emails preference when unsubscribing via the footer', function () {
    $user = User::factory()->create([
        'email' => 'client@example.com',
        'notify_promotional_emails' => true,
    ]);
    Subscription::create(['email' => 'client@example.com']);

    $this->postJson(route('subscription.unsubscribe'), ['email' => 'client@example.com'])
        ->assertOk();

    expect($user->refresh()->notify_promotional_emails)->toBeFalse();
    expect(Subscription::where('email', 'client@example.com')->exists())->toBeFalse();
});

it('does not error when subscribing or unsubscribing an email with no matching user account', function () {
    $this->postJson(route('subscription.subscribe'), ['email' => 'nouser@example.com'])
        ->assertOk();

    expect(Subscription::where('email', 'nouser@example.com')->exists())->toBeTrue();

    $this->postJson(route('subscription.unsubscribe'), ['email' => 'nouser@example.com'])
        ->assertOk();

    expect(Subscription::where('email', 'nouser@example.com')->exists())->toBeFalse();
});

it('turns off a matching user\'s promotional emails preference when an admin removes the subscriber', function () {
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
