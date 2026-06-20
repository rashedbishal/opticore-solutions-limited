<?php

use App\Models\Task;
use App\Models\Transaction;
use App\Models\User;

it('soft-deletes the account, frees the email for reuse, and preserves the original email for admin records', function () {
    $user = User::factory()->create(['email' => 'leaving@example.com']);

    $this->actingAs($user)
        ->delete(route('profile.delete'), ['password' => 'password'])
        ->assertRedirect('/');

    $this->assertGuest();

    $user->refresh();
    expect($user->trashed())->toBeTrue();
    expect($user->original_email)->toBe('leaving@example.com');
    expect($user->email)->toBe("deleted-user-{$user->id}@deleted.invalid");
});

it("keeps a deleted account's workflow tasks and transactions intact and admin-visible", function () {
    $user = User::factory()->create(['email' => 'history@example.com']);
    $task = Task::factory()->create(['user_id' => $user->id]);
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
