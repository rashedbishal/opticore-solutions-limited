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
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('contact_email')->nullable();
            $table->string('phone_usa')->nullable();
            $table->string('phone_bangladesh')->nullable();
            $table->text('address_usa')->nullable();
            $table->string('address_usa_map_url')->nullable();
            $table->text('address_bangladesh')->nullable();
            $table->string('address_bangladesh_map_url')->nullable();
            $table->string('social_facebook')->nullable();
            $table->string('social_x')->nullable();
            $table->string('social_instagram')->nullable();
            $table->string('social_linkedin')->nullable();
            $table->string('social_youtube')->nullable();
            $table->string('social_behance')->nullable();
            $table->string('social_pinterest')->nullable();
            $table->string('social_tiktok')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
