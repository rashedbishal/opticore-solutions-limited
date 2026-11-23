<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lead Management Phase 5B: calling leads from the CMS.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Whether a lead allows our calls (Meta's rule), one row per lead.
        Schema::create('lead_call_permissions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->unique()->constrained('leads')->cascadeOnDelete();
            $table->foreignUlid('lead_source_id')->constrained('lead_sources')->cascadeOnDelete();
            $table->string('status');
            $table->string('meta_raw_status')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamp('last_requested_at')->nullable();
            $table->timestamps();
        });

        Schema::table('lead_calls', function (Blueprint $table) {
            // An outgoing call has no Meta id until Meta accepts the dial.
            $table->string('external_call_id', 191)->nullable()->change();
            $table->string('biz_opaque_callback_data')->nullable();
            $table->timestamp('consumer_accepted_at')->nullable();
            $table->index(['lead_id', 'direction', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('lead_calls', function (Blueprint $table) {
            $table->dropIndex(['lead_id', 'direction', 'status']);
            $table->dropColumn(['biz_opaque_callback_data', 'consumer_accepted_at']);
        });
        Schema::dropIfExists('lead_call_permissions');
    }
};
