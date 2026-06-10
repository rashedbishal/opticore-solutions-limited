<?php

use App\Models\PortfolioSubCategory;
use App\Models\Task;
use App\Models\Transaction;
use App\Models\User;
use App\Support\TaskGenerator;

function createTaskGeneratorTransaction(array $attributes = []): Transaction
{
    return Transaction::create(array_merge([
        'name' => 'Transaction Customer',
        'email' => 'transaction-customer@example.com',
        'amount' => 100,
        'status' => 'Processing',
        'transaction_id' => 'txn-'.uniqid(),
        'category' => 'graphic-design',
    ], $attributes));
}

it('generates a task name from the category and sub-category', function () {
    $subCategory = PortfolioSubCategory::factory()->create([
        'category_slug' => 'graphic-design',
        'name' => 'Logo, Branding and Rebranding',
    ]);

    expect(TaskGenerator::taskName('graphic-design', $subCategory->id))
        ->toBe('Logo, Branding and Rebranding - Graphic Design');
});

it('generates a task name from the category alone when there is no sub-category', function () {
    expect(TaskGenerator::taskName('web-development', null))
        ->toBe('Web Development Service');
});

it('falls back to a humanized category slug when the category is unknown', function () {
    expect(TaskGenerator::taskName('mystery-category', null))
        ->toBe('Mystery Category Service');
});

it('creates a pending workflow task from a paid transaction', function () {
    $user = User::factory()->create(['email' => 'client@example.com']);
    $subCategory = PortfolioSubCategory::factory()->create([
        'category_slug' => 'graphic-design',
        'name' => 'Logo, Branding and Rebranding',
    ]);

    $transaction = createTaskGeneratorTransaction([
        'name' => 'John Doe',
        'email' => 'client@example.com',
        'category' => 'graphic-design',
        'subcategory_id' => $subCategory->id,
        'transaction_id' => 'txn-create-task',
    ]);

    $task = TaskGenerator::createFromTransaction($transaction);

    expect($task)->toBeInstanceOf(Task::class);

    $this->assertDatabaseHas('tasks', [
        'transaction_id' => 'txn-create-task',
        'client_name' => 'John Doe',
        'user_id' => $user->id,
        'category' => 'graphic-design',
        'sub_category_id' => $subCategory->id,
        'task_name' => 'Logo, Branding and Rebranding - Graphic Design',
        'state' => 'pending',
        'date' => now()->toDateString(),
    ]);
});

it('does not create a duplicate task for the same transaction', function () {
    User::factory()->create(['email' => 'client@example.com']);

    $transaction = createTaskGeneratorTransaction([
        'email' => 'client@example.com',
        'transaction_id' => 'txn-duplicate',
    ]);

    expect(TaskGenerator::createFromTransaction($transaction))->toBeInstanceOf(Task::class);
    expect(TaskGenerator::createFromTransaction($transaction))->toBeNull();

    expect(Task::where('transaction_id', 'txn-duplicate')->count())->toBe(1);
});

it('does not create a task when the transaction has no category', function () {
    User::factory()->create(['email' => 'client@example.com']);

    $transaction = createTaskGeneratorTransaction([
        'email' => 'client@example.com',
        'category' => null,
        'transaction_id' => 'txn-no-category',
    ]);

    expect(TaskGenerator::createFromTransaction($transaction))->toBeNull();
    $this->assertDatabaseMissing('tasks', ['transaction_id' => 'txn-no-category']);
});

it('does not create a task when no user matches the transaction email', function () {
    $transaction = createTaskGeneratorTransaction([
        'email' => 'no-account@example.com',
        'transaction_id' => 'txn-no-user',
    ]);

    expect(TaskGenerator::createFromTransaction($transaction))->toBeNull();
    $this->assertDatabaseMissing('tasks', ['transaction_id' => 'txn-no-user']);
});
