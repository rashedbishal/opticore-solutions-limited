<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('portfolios', function (Blueprint $table) {
            $table->renameColumn('image', 'media_path');
        });
        Schema::table('portfolios', function (Blueprint $table) {
            $table->string('media_type')->default('image')->after('media_path');
        });

        // Loop over the existing portfolios and clean data
        $portfolios = DB::table('portfolios')->get();
        foreach ($portfolios as $portfolio) {
            // Clean up the storage path logic as requested (remove '/storage/' noise)
            $path = $portfolio->media_path;
            if ($path) {
                if (Str::startsWith($path, '/storage/')) {
                    $path = substr($path, 9);
                } elseif (Str::contains($path, '/storage/')) {
                    $path = substr($path, strpos($path, '/storage/') + 9);
                }
            }

            // Update legacy categories to new equivalents matching config keys
            $categoryMap = [
                'logo-identity' => 'graphic-design',
                'packaging-design' => 'graphic-design',
                'social-media-graphics' => 'digital-marketing',
                'print-design' => 'graphic-design',
                'photoshop-editing' => 'video-editing', // Just as a mapping example to ensure nothing is broken
            ];

            DB::table('portfolios')->where('id', $portfolio->id)->update([
                'media_path' => $path,
                'category' => $categoryMap[$portfolio->category] ?? $portfolio->category,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('portfolios', function (Blueprint $table) {
            $table->dropColumn('media_type');
            $table->renameColumn('media_path', 'image');
        });
    }
};
