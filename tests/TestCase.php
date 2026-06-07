<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Cache;

abstract class TestCase extends BaseTestCase
{
    /**
     * The connections that should be transacted during testing.
     *
     * @var array<int, string>
     */
    protected array $connectionsToTransact = ['pgsql', 'admin'];

    protected function setUp(): void
    {
        parent::setUp();

        // ThrottleRequests hashes the cache key as md5(limiterName . rawKey).
        // The 'register' limiter is keyed by IP only, so all test requests from
        // 127.0.0.1 share the same hashed key (md5('register127.0.0.1')).
        // Without this flush the counter accumulates across test methods and
        // trips the limit mid-suite. The array driver is in-memory and only
        // lives for this test run, so flushing it between tests is safe.
        Cache::flush();
    }

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
