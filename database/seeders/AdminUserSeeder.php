<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        Admin::firstOrCreate(
            ['email' => 'rashed.bishal@live.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('00000000'),
                'email_verified_at' => now(),
            ]
        );
    }
}
