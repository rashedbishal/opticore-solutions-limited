<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lead Management Phase 5A: WhatsApp calls answered in the browser.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_calls', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignUlid('lead_source_id')->constrained('lead_sources')->cascadeOnDelete();
            $table->foreignUlid('conversation_id')->nullable()->constrained('lead_conversations')->nullOnDelete();
            $table->string('external_call_id', 191);
            $table->string('direction')->default('inbound');
            $table->string('status');
            $table->string('end_reason')->nullable();
            $table->string('meta_stage')->nullable();
            $table->string('meta_status', 64)->nullable();
            $table->timestamp('meta_terminated_at')->nullable();
            // Who should ring, decided once when the call arrives.
            $table->unsignedBigInteger('assignee_id_at_arrival')->nullable();
            $table->string('routing_mode');
            $table->json('routed_user_ids');
            $table->unsignedBigInteger('claimed_by')->nullable()->index();
            $table->string('claimed_by_name')->nullable();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('connected_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->timestamp('ringing_expires_at')->nullable();
            $table->timestamps();

            $table->unique(['lead_source_id', 'external_call_id']);
            $table->index(['status', 'ringing_expires_at']);
            $table->index(['lead_id', 'created_at']);
        });

        Schema::table('lead_sources', function (Blueprint $table) {
            // Our intent, and what Meta last reported — kept apart.
            $table->boolean('calling_enabled')->default(false);
            $table->string('calling_meta_status')->nullable();
            $table->timestamp('calling_meta_checked_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('lead_sources', function (Blueprint $table) {
            $table->dropColumn(['calling_enabled', 'calling_meta_status', 'calling_meta_checked_at']);
        });
        Schema::dropIfExists('lead_calls');
    }
};
