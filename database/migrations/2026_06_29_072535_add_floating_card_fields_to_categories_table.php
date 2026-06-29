<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->boolean('floating_card_enabled')->default(false)->after('is_active');
            $table->string('floating_card_title')->nullable()->after('floating_card_enabled');
            $table->text('floating_card_description')->nullable()->after('floating_card_title');
            $table->string('floating_card_image')->nullable()->after('floating_card_description');
            $table->string('floating_card_thumb')->nullable()->after('floating_card_image');
            $table->unsignedSmallInteger('floating_card_sort_order')->default(0)->after('floating_card_thumb');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn([
                'floating_card_enabled',
                'floating_card_title',
                'floating_card_description',
                'floating_card_image',
                'floating_card_thumb',
                'floating_card_sort_order',
            ]);
        });
    }
};
