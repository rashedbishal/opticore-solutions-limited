<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lead Management Phase 6: the "Opticore WhatsApp Calling" phone app.
 */
return new class extends Migration
{
    public function up(): void
    {
        // One connected phone per admin.
        Schema::create('calling_app_devices', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->unsignedBigInteger('admin_id')->unique();
            $table->unsignedBigInteger('personal_access_token_id')->nullable();
            $table->string('device_name', 100)->nullable();
            // Proves "this browser is on the connected phone" (hash only).
            $table->string('browser_marker_hash', 64)->nullable();
            $table->text('fcm_token')->nullable();
            $table->timestamp('fcm_token_updated_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
        });

        Schema::table('lead_settings', function (Blueprint $table) {
            $table->text('firebase_service_account')->nullable();
            $table->string('apk_path')->nullable();
            $table->string('apk_version')->nullable();
            $table->unsignedInteger('apk_version_code')->nullable();
            $table->unsignedBigInteger('apk_size')->nullable();
            $table->text('apk_notes')->nullable();
            $table->timestamp('apk_uploaded_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('lead_settings', function (Blueprint $table) {
            $table->dropColumn(['firebase_service_account', 'apk_path', 'apk_version', 'apk_version_code', 'apk_size', 'apk_notes', 'apk_uploaded_at']);
        });
        Schema::dropIfExists('calling_app_devices');
    }
};
