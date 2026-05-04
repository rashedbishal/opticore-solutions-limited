<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * The connections that should be transacted during testing.
     *
     * @var array<int, string>
     */
    protected array $connectionsToTransact = ['pgsql', 'admin'];

    /**
     * Refresh the test database.
     *
     * @return void
     */
    protected function refreshTestDatabase()
    {
        parent::refreshTestDatabase();

        // Also migrate the secondary connections
        $this->artisan('migrate:fresh', [
            '--database' => 'admin',
        ]);
    }
}
