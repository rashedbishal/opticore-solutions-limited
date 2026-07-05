<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Hash Driver
    |--------------------------------------------------------------------------
    |
    | This option controls the default hash driver that will be used to hash
    | passwords for your application. By default, the bcrypt algorithm is
    | used; however, you remain free to modify this option if you wish.
    |
    | Supported: "bcrypt", "argon", "argon2id"
    |
    */

    'driver' => env('HASH_DRIVER', 'argon2id'),

    /*
    |--------------------------------------------------------------------------
    | Bcrypt Options
    |--------------------------------------------------------------------------
    |
    | Here you may specify the configuration options that should be used when
    | passwords are hashed using the Bcrypt algorithm. This will allow you
    | to control the amount of time it takes to hash the given password.
    |
    */

    'bcrypt' => [
        'rounds' => env('BCRYPT_ROUNDS', 12),
        // false, not Laravel's stub default of true: the "verify" guard makes
        // a driver's Hash::check() throw on any hash it didn't produce itself
        // (e.g. argon2id refusing to check a bcrypt hash) instead of just
        // verifying it — which breaks every existing bcrypt user's login the
        // moment the default driver flips to argon2id, defeating the whole
        // point of rehash_on_login's graceful, no-forced-reset migration.
        'verify' => env('HASH_VERIFY', false),
        'limit' => env('BCRYPT_LIMIT', null),
    ],

    /*
    |--------------------------------------------------------------------------
    | Argon Options
    |--------------------------------------------------------------------------
    |
    | Here you may specify the configuration options that should be used when
    | passwords are hashed using the Argon algorithm. These will allow you
    | to control the amount of time it takes to hash the given password.
    |
    | These options are shared by both the "argon" (Argon2i) and "argon2id"
    | drivers — memory/time/threads exceed OWASP's minimum recommendation
    | (19 MiB / t=2 / p=1) comfortably.
    |
    */

    'argon' => [
        'memory' => env('ARGON_MEMORY', 65536),
        'threads' => env('ARGON_THREADS', 1),
        'time' => env('ARGON_TIME', 4),
        // false, not Laravel's stub default of true: the "verify" guard makes
        // a driver's Hash::check() throw on any hash it didn't produce itself
        // (e.g. argon2id refusing to check a bcrypt hash) instead of just
        // verifying it — which breaks every existing bcrypt user's login the
        // moment the default driver flips to argon2id, defeating the whole
        // point of rehash_on_login's graceful, no-forced-reset migration.
        'verify' => env('HASH_VERIFY', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Rehash On Login
    |--------------------------------------------------------------------------
    |
    | Setting this option to true will tell Laravel to automatically rehash
    | the user's password during login if the configured work factor for
    | the algorithm has changed, allowing graceful upgrades of hashes.
    |
    | This is what upgrades existing bcrypt password hashes (User and Admin
    | both use this, via the shared "web"/"admin" SessionGuard) to argon2id
    | transparently over time as each account logs in — no forced password
    | resets or migration needed.
    |
    */

    'rehash_on_login' => true,

];
