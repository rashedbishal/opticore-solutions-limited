<?php

use App\Models\Admin;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/**
 * Tests the routes/channels.php authorization closures directly via
 * Broadcast::getChannels(), which returns the exact closures registered at
 * boot keyed by their route pattern — this sidesteps needing a real
 * Pusher/Reverb broadcaster connection (the `null` driver used everywhere
 * else in tests never invokes these closures at all).
 */
function channelCallback(string $pattern): callable
{
    return Broadcast::getChannels()->get($pattern);
}

it('blocks an admin without the customer-conversations permission from the admin.conversations channel', function () {
    $admin = Admin::factory()->regular()->create();

    expect(channelCallback('admin.conversations')($admin))->toBeFalsy();
});

it('allows an admin with the customer-conversations permission onto the admin.conversations channel', function () {
    $admin = Admin::factory()->withPermissions(['customer-conversations'])->create();

    expect(channelCallback('admin.conversations')($admin))->toBeTrue();
});

it('blocks an admin without the orders permission from the admin.orders channel', function () {
    $admin = Admin::factory()->regular()->create();

    expect(channelCallback('admin.orders')($admin))->toBeFalsy();
});

it('allows an admin with the orders permission onto the admin.orders channel', function () {
    $admin = Admin::factory()->withPermissions(['orders'])->create();

    expect(channelCallback('admin.orders')($admin))->toBeTrue();
});

it('blocks an admin without the transactions permission from the admin.transactions channel', function () {
    $admin = Admin::factory()->regular()->create();

    expect(channelCallback('admin.transactions')($admin))->toBeFalsy();
});

it('allows an admin with the transactions permission onto the admin.transactions channel', function () {
    $admin = Admin::factory()->withPermissions(['transactions'])->create();

    expect(channelCallback('admin.transactions')($admin))->toBeTrue();
});

it('blocks an admin without the tasks permission from the admin.tasks channel', function () {
    $admin = Admin::factory()->regular()->create();

    expect(channelCallback('admin.tasks')($admin))->toBeFalsy();
});

it('allows an admin with the tasks permission onto the admin.tasks channel', function () {
    $admin = Admin::factory()->withPermissions(['tasks'])->create();

    expect(channelCallback('admin.tasks')($admin))->toBeTrue();
});

it('blocks an admin without the customer-conversations permission from a specific conversation channel', function () {
    $admin = Admin::factory()->regular()->create();
    $user = User::factory()->create();
    $conversation = Conversation::create(['user_id' => $user->id]);

    expect(channelCallback('conversations.{id}')($admin, $conversation->id))->toBeFalsy();
});

it('allows an admin with the customer-conversations permission onto a specific conversation channel', function () {
    $admin = Admin::factory()->withPermissions(['customer-conversations'])->create();
    $user = User::factory()->create();
    $conversation = Conversation::create(['user_id' => $user->id]);

    expect(channelCallback('conversations.{id}')($admin, $conversation->id))->toBeTrue();
});

it('allows a web user onto their own conversation channel', function () {
    $user = User::factory()->create();
    $conversation = Conversation::create(['user_id' => $user->id]);

    expect(channelCallback('conversations.{id}')($user, $conversation->id))->toBeTrue();
});

it('blocks a web user from a conversation channel they do not own', function () {
    $owner = User::factory()->create();
    $conversation = Conversation::create(['user_id' => $owner->id]);
    $stranger = User::factory()->create();

    expect(channelCallback('conversations.{id}')($stranger, $conversation->id))->toBeFalsy();
});
