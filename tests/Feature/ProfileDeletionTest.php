<?php

use App\Models\Admin;
use App\Models\Conversation;
use App\Models\Task;
use App\Models\Transaction;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('soft-deletes the account, frees the email for reuse, and preserves the original email for admin records', function () {
    $user = User::factory()->create(['email' => 'leaving@example.com']);

    $this->actingAs($user)
        ->delete(route('profile.delete'), ['password' => 'password'])
        ->assertRedirect('/');

    $this->assertGuest();

    $user->refresh();
    expect($user->trashed())->toBeTrue();
    expect($user->original_email)->toBe('leaving@example.com');

    // The stored column is rewritten so the address is free for reuse...
    expect($user->getRawOriginal('email'))->toBe("deleted-user-{$user->id}@deleted.invalid");

    // ...but every read of $user->email transparently falls back to the
    // original address once trashed, so CMS views keep showing it.
    expect($user->email)->toBe('leaving@example.com');
});

it("keeps a deleted account's workflow tasks and transactions intact and admin-visible", function () {
    $user = User::factory()->create(['name' => 'History Client', 'email' => 'history@example.com']);
    $task = Task::factory()->create(['user_id' => $user->id]);
    $conversation = Conversation::query()->create(['user_id' => $user->id]);
    $offer = $conversation->offers()->create([
        'payment_type' => 'single',
        'description' => 'A custom offer',
        'price' => 150,
        'delivery_days' => 5,
        'status' => 'pending',
        'offer_token' => 'history-offer-token',
    ]);
    $transaction = Transaction::create([
        'name' => $user->name,
        'email' => $user->email,
        'transaction_id' => 'TRX-HISTORY-1',
        'amount' => '100',
        'currency' => 'USD',
        'status' => 'Processing',
        'invoice_number' => 'INV-HISTORY-1',
    ]);

    $this->actingAs($user)
        ->delete(route('profile.delete'), ['password' => 'password'])
        ->assertRedirect('/');

    $this->assertDatabaseHas('tasks', ['id' => $task->id, 'user_id' => $user->id]);
    $this->assertDatabaseHas('transactions', ['id' => $transaction->id, 'email' => 'history@example.com']);

    // Not just present in the DB — actually rendered in every admin view
    // that surfaces this client's identity, now that the account is gone.
    $admin = Admin::factory()->create();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.tasks.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('tasks.data.0.client_email', 'history@example.com')
        );

    $this->actingAs($admin, 'admin')
        ->getJson(route('admin.customer-conversations.list'))
        ->assertSuccessful()
        ->assertJsonPath('data.0.user.name', 'History Client')
        ->assertJsonPath('data.0.user.email', 'history@example.com');

    $this->actingAs($admin, 'admin')
        ->get(route('offer.show', $offer->offer_token))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('offer.conversation.user.name', 'History Client')
        );
});

it('does not require a password to delete a social-only account', function () {
    $user = User::factory()->create(['google_id' => 'google-123', 'email' => 'social@example.com']);

    $this->actingAs($user)
        ->delete(route('profile.delete'))
        ->assertRedirect('/');

    $this->assertGuest();

    $user->refresh();
    expect($user->trashed())->toBeTrue();
    expect($user->original_email)->toBe('social@example.com');
});
