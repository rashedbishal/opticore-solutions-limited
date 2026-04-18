<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
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
