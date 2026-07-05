<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Hash Driver
    |--------------------------------------------------------------------------
    |
    | Deliberately argon2id only — bcrypt is not supported by this app.
    | 'verify' below is on, so a bcrypt hash would be rejected outright
    | rather than silently accepted. Every account was force-reset via
    | `auth:force-password-reset` specifically so no bcrypt hash would ever
    | need to be read again.
    |
    */

    'driver' => env('HASH_DRIVER', 'argon2id'),

    /*
    |--------------------------------------------------------------------------
    | Bcrypt Options
    |--------------------------------------------------------------------------
    |
    | Explicitly emptied, not omitted: Laravel 11+ auto-merges any config
    | key this file doesn't set from its own internal default config (see
    | Illuminate\Foundation\Bootstrap\LoadConfiguration::getBaseConfiguration())
    | — which still ships a populated 'bcrypt' block. Simply not declaring
    | this key here does NOT remove it; it silently comes back from the
    | framework default. It has to be declared and blanked explicitly.
    |
    */

    'bcrypt' => [],

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
        'verify' => env('HASH_VERIFY', true),
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
    | Kept on for any future work-factor changes (e.g. raising argon's memory
    | cost later) — not relied on for the bcrypt -> argon2id migration itself,
    | since every account was force-reset via `auth:force-password-reset`
    | rather than gracefully upgraded on next login.
    |
    */

    'rehash_on_login' => true,

];
