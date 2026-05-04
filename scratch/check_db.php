<?php

use App\Models\Admin;
use App\Models\User;
use Illuminate\Support\Facades\DB;

try {
    echo "Checking default connection...\n";
    DB::connection()->getPdo();
    echo "Default connection OK.\n";

    echo "Checking admin connection...\n";
    DB::connection('admin')->getPdo();
    echo "Admin connection OK.\n";

    echo "Creating Admin...\n";
    $admin = Admin::factory()->create();
    echo "Admin created with ID: {$admin->id}\n";

    echo "Creating User...\n";
    $user = User::factory()->create();
    echo "User created with ID: {$user->id}\n";

    echo "All good!\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
