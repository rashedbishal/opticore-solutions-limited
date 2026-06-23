<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // 'slate' is the neutral/muted palette entry — categories that
            // haven't had a color deliberately chosen yet should look
            // unconfigured, not like an admin picked a vivid brand color.
            $table->string('color')->default('slate')->after('icon');
        });

        // Backfill the 5 categories that already exist with the color each
        // one was hardcoded to in resources/js/pages/HireUs.tsx, so this
        // migration is a visual no-op for them.
        $colors = [
            'graphic-design' => 'pink',
            '3d-production' => 'violet',
            'web-development' => 'emerald',
            'digital-marketing' => 'orange',
            'video-editing' => 'cyan',
        ];

        foreach ($colors as $slug => $color) {
            DB::table('categories')->where('slug', $slug)->update(['color' => $color]);
        }

        // configShape()'s cached shape now includes icon/color — drop any
        // entry cached under the old shape so it's recomputed on next read.
        Cache::forget('categories.config-shape');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('color');
        });
    }
};
