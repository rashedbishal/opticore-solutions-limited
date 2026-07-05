<?php

use App\Models\Admin;
use App\Models\Conversation;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create(['password' => Hash::make('admin-secret')]);
});

it('lists clients with conversation and task counts', function () {
    $client = User::factory()->create(['role' => 'user', 'name' => 'Listed Client']);
    Conversation::query()->create(['user_id' => $client->id]);
    Task::factory()->create(['user_id' => $client->id]);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.clients.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Client/Index')
            ->where('clients.data.0.name', 'Listed Client')
            ->where('clients.data.0.conversations_count', 1)
            ->where('clients.data.0.tasks_count', 1)
        );
});

it('shows the original email for a self-deleted client instead of the mangled placeholder', function () {
    $client = User::factory()->create(['role' => 'user', 'email' => 'self-deleted@example.com']);

    $this->actingAs($client)
        ->delete(route('profile.delete'), ['password' => 'password'])
        ->assertRedirect('/');

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.clients.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('clients.data.0.original_email', 'self-deleted@example.com')
        );
});

it('does not list admin accounts in the client index', function () {
    $client = User::factory()->create(['role' => 'user', 'name' => 'Real Client']);
    User::factory()->create(['role' => 'admin', 'name' => 'Admin Masquerading As User']);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.clients.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('clients.data', fn ($clients) => collect($clients)->pluck('name')->toArray() === ['Real Client'])
        );
});

it('rejects client deletion without the admin password', function () {
    $client = User::factory()->create(['role' => 'user']);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.clients.destroy', $client))
        ->assertSessionHasErrors(['password']);

    $this->assertDatabaseHas('users', ['id' => $client->id]);
});

it('rejects client deletion with an incorrect admin password', function () {
    $client = User::factory()->create(['role' => 'user']);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.clients.destroy', $client), ['password' => 'wrong-password'])
        ->assertSessionHasErrors(['password']);

    $this->assertDatabaseHas('users', ['id' => $client->id]);
});

it('prevents deleting an admin account through the client deletion route', function () {
    $adminAsUser = User::factory()->create(['role' => 'admin']);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.clients.destroy', $adminAsUser), ['password' => 'admin-secret'])
        ->assertRedirect();

    $this->assertDatabaseHas('users', ['id' => $adminAsUser->id]);
});

it('deletes a client and cascades to their conversations, offers, messages, and tasks', function () {
    $client = User::factory()->create(['role' => 'user']);

    $conversation = Conversation::query()->create(['user_id' => $client->id]);
    $message = $conversation->messages()->create([
        'sender_type' => 'user',
        'sender_id' => $client->id,
        'message' => 'Hello there',
    ]);
    $offer = $conversation->offers()->create([
        'payment_type' => 'single',
        'description' => 'A custom offer',
        'request_requirements' => true,
        'price' => 100,
        'delivery_days' => 5,
        'status' => 'pending',
        'offer_token' => 'token-for-cascade-test',
    ]);
    $milestone = $offer->milestones()->create([
        'name' => 'Milestone 1',
        'delivery_days' => 3,
        'price' => 50,
        'sort_order' => 0,
    ]);
    $task = Task::factory()->create(['user_id' => $client->id]);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.clients.destroy', $client), ['password' => 'admin-secret'])
        ->assertRedirect();

    $this->assertDatabaseMissing('users', ['id' => $client->id]);
    $this->assertDatabaseMissing('conversations', ['id' => $conversation->id]);
    $this->assertDatabaseMissing('messages', ['id' => $message->id]);
    $this->assertDatabaseMissing('offers', ['id' => $offer->id]);
    $this->assertDatabaseMissing('offer_milestones', ['id' => $milestone->id]);
    $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
});

it('blocks guests and non-admin users from client management routes', function () {
    $client = User::factory()->create(['role' => 'user']);
    $user = User::factory()->create(['role' => 'user']);

    $this->get(route('admin.clients.index'))->assertRedirect(route('admin.login'));
    $this->delete(route('admin.clients.destroy', $client))->assertRedirect(route('admin.login'));

    $this->actingAs($user)->get(route('admin.clients.index'))->assertRedirect(route('admin.login'));
    $this->actingAs($user)->delete(route('admin.clients.destroy', $client))->assertRedirect(route('admin.login'));

    $this->assertDatabaseHas('users', ['id' => $client->id]);
});
