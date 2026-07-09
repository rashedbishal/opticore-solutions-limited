<?php

namespace Tests;

use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Cache;

abstract class TestCase extends BaseTestCase
{
    /**
     * The connections that should be transacted during testing.
     *
     * @var array<int, string>
     */
    protected array $connectionsToTransact = ['pgsql', 'admin', 'meal'];

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

        $this->seed(CategorySeeder::class);
    }

    // No explicit `migrate:fresh --database=admin` (or `=meal`) here: the
    // admin- and meal-connection migrations declare their own
    // `protected $connection` and call Schema::connection(...) explicitly,
    // so the plain migrate:fresh in parent::refreshTestDatabase() already
    // routes them to the right database correctly. An earlier version of
    // this method added a second `migrate:fresh --database=admin` pass,
    // which replays every OTHER migration (the ones with no explicit
    // connection) against the admin database too — the same footgun
    // documented in scripts/deploy/deploy.sh, and confirmed to actually
    // reproduce when run directly. The separate opticoresolutions_admin_test
    // / opticoresolutions_meal_test databases are expected to already exist
    // (see ci.yml's explicit `CREATE DATABASE` steps; create them once
    // locally the same way if missing).
}
