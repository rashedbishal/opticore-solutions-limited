<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'rashed.bishal@live.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('00000000'),
            ]
        );
    }
}
