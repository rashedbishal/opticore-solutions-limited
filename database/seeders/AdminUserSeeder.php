<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Admin::firstOrCreate(
            ['email' => 'rashed.bishal@live.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('00000000'),
                'email_verified_at' => now(),
                'is_super_admin' => true,
                'full_access' => true,
            ]
        );

        if (! $admin->is_super_admin) {
            $admin->forceFill(['is_super_admin' => true, 'full_access' => true])->save();
        }
    }
}
