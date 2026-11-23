<?php

namespace App\Leads\Models;

use Illuminate\Notifications\DatabaseNotification;

/**
 * Database notification stored in the main database even though the
 * notifiable Admin lives on the separate `admin` connection. Without the
 * explicit connection, Eloquent would resolve the relation on the parent's
 * (`admin`) connection.
 */
class AdminNotification extends DatabaseNotification
{
    protected $connection = 'pgsql';
}
