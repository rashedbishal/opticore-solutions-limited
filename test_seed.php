<?php
$seeder = new Database\Seeders\PortfolioSubCategorySeeder();
$seeder->run();
echo "Seeded. Count: " . App\Models\PortfolioSubCategory::count() . "\n";
