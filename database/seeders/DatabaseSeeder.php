<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            PortfolioSubCategorySeeder::class,
        ]);

        User::firstOrCreate(
            ['email' => 'rashed.bishal@live.com'],
            [
                'name' => 'Regular User',
                'password' => Hash::make('00000000'),
                'email_verified_at' => now(),
            ]
        );
    }
}
