<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (! SiteSetting::query()->exists()) {
            SiteSetting::create(SiteSetting::defaults());
        }
    }
}
