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
        Schema::table('categories', function (Blueprint $table) {
            $table->string('icon')->nullable()->after('description');
            $table->text('long_description')->nullable()->after('icon');
            $table->json('headings')->nullable()->after('long_description');
            $table->json('sub_services')->nullable()->after('headings');
            $table->json('reasons')->nullable()->after('sub_services');
            $table->json('process')->nullable()->after('reasons');
            // Gates only the public marketing landing page (/{slug}), never
            // /hire-us — defaults false so a category created for hire-us
            // grouping alone doesn't silently publish an empty landing page;
            // the data-migration below sets this explicitly true for the
            // categories that already had one.
            $table->boolean('is_active')->default(false)->after('process');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn([
                'icon',
                'long_description',
                'headings',
                'sub_services',
                'reasons',
                'process',
                'is_active',
            ]);
        });
    }
};
