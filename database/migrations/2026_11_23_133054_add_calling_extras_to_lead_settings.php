<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lead Management Phase 5C: push keys (stored encrypted, set by the mother
 * admin) and the shared custom ringtone.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_settings', function (Blueprint $table) {
            $table->text('vapid_public_key')->nullable();
            $table->text('vapid_private_key')->nullable();
            $table->string('ringtone_path')->nullable();
            $table->string('ringtone_name')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('lead_settings', function (Blueprint $table) {
            $table->dropColumn(['vapid_public_key', 'vapid_private_key', 'ringtone_path', 'ringtone_name']);
        });
    }
};
