<?php

namespace App\Leads\CallingApp;

use Laravel\Sanctum\PersonalAccessToken;

/**
 * Sanctum tokens live in the main database. Admins are on their own
 * connection, and a token made through an admin would otherwise follow it.
 */
class CallingAppToken extends PersonalAccessToken
{
    protected $connection = 'pgsql';

    protected $table = 'personal_access_tokens';
}
