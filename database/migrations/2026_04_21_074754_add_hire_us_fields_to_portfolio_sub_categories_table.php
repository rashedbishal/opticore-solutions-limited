<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('portfolio_sub_categories', function (Blueprint $table) {
            $table->string('price')->nullable()->after('description');
            $table->decimal('rating', 2, 1)->default(5.0)->after('price');
            $table->unsignedInteger('reviews_count')->default(0)->after('rating');
            $table->string('image')->nullable()->after('reviews_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('portfolio_sub_categories', function (Blueprint $table) {
            $table->dropColumn([
                'price',
                'rating',
                'reviews_count',
                'image',
            ]);
        });
    }
};
