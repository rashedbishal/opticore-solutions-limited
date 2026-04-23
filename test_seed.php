<?php

use App\Models\PortfolioSubCategory;
use Database\Seeders\PortfolioSubCategorySeeder;

$seeder = new PortfolioSubCategorySeeder;
$seeder->run();
echo 'Seeded. Count: '.PortfolioSubCategory::count()."\n";
