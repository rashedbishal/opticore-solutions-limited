<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lead Management Phase 2A: Facebook / Instagram / WhatsApp channels.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_sources', function (Blueprint $table) {
            // Last time anything arrived from this source (health: "quiet").
            $table->timestamp('last_synced_at')->nullable();
            // Last webhook rejected for a bad signature (health warning).
            $table->timestamp('last_signature_rejection_at')->nullable();
            $table->string('last_signature_rejection_reason')->nullable();
        });

        // Latest daily key check per Meta source.
        Schema::create('lead_source_token_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('lead_source_id')->unique()->constrained('lead_sources')->cascadeOnDelete();
            $table->string('status');
            $table->timestamp('expires_at')->nullable();
            $table->boolean('expiry_known')->default(false);
            $table->string('error', 500)->nullable();
            $table->timestamp('checked_at');
            $table->timestamps();
        });

        // One chat thread per person per channel source.
        Schema::create('lead_conversations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignUlid('lead_source_id')->constrained('lead_sources')->restrictOnDelete();
            $table->string('channel');
            $table->string('external_thread_id');
            $table->timestamp('last_inbound_at')->nullable();
            $table->timestamp('last_outbound_at')->nullable();
            $table->timestamps();

            $table->unique(['lead_source_id', 'channel', 'external_thread_id']);
        });

        Schema::create('lead_messages', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('conversation_id')->constrained('lead_conversations')->cascadeOnDelete();
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->string('channel');
            $table->string('direction');
            $table->string('message_type')->default('text');
            $table->text('body')->nullable();
            $table->string('external_message_id')->nullable();
            $table->string('external_participant_id')->nullable();
            $table->string('status')->nullable();
            $table->timestamp('status_updated_at')->nullable();
            $table->string('failure_reason', 500)->nullable();
            $table->unsignedBigInteger('sent_by')->nullable();
            $table->string('sent_by_name')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['channel', 'external_message_id']);
            $table->index(['lead_id', 'created_at']);
        });

        // Pictures, videos, voice notes and files people send.
        Schema::create('lead_attachments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->string('type');
            $table->string('status');
            $table->string('path')->nullable();
            $table->string('mime')->nullable();
            $table->text('original_media_url')->nullable();
            $table->string('failure_reason', 500)->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_attachments');
        Schema::dropIfExists('lead_messages');
        Schema::dropIfExists('lead_conversations');
        Schema::dropIfExists('lead_source_token_checks');

        Schema::table('lead_sources', function (Blueprint $table) {
            $table->dropColumn(['last_synced_at', 'last_signature_rejection_at', 'last_signature_rejection_reason']);
        });
    }
};
