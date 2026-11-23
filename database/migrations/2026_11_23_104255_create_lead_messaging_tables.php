<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lead Management Phase 3: replies, templates and consent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_messages', function (Blueprint $table) {
            $table->string('attachment_path')->nullable();
            $table->string('attachment_mime')->nullable();
            $table->string('attachment_name')->nullable();
            $table->unsignedBigInteger('attachment_size')->nullable();
            // A template message keeps a copy of what was sent (no link to
            // the template, which may later be deleted).
            $table->string('template_name')->nullable();
            $table->string('template_language')->nullable();
            $table->json('template_variables')->nullable();
            // A failed message that was resent points at its replacement.
            $table->foreignUlid('resend_message_id')->nullable()->constrained('lead_messages')->nullOnDelete();
            $table->timestamp('activity_log_hidden_at')->nullable();
        });

        Schema::create('whatsapp_message_templates', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_source_id')->constrained('lead_sources')->cascadeOnDelete();
            $table->string('name', 512);
            $table->string('language', 35);
            $table->unsignedTinyInteger('variable_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['lead_source_id', 'name', 'language']);
        });

        Schema::create('messenger_message_templates', function (Blueprint $table) {
            $table->ulid('id')->primary();
            // One template per Facebook Page (same as OptiFin).
            $table->foreignUlid('lead_source_id')->unique()->constrained('lead_sources')->cascadeOnDelete();
            $table->string('name', 512);
            $table->string('language', 35);
            $table->text('body_text');
            $table->unsignedTinyInteger('variable_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Consent: the current state per lead and type, plus a permanent
        // history. Both survive the lead being deleted (lead_id becomes
        // null; the number and name are kept as a snapshot).
        foreach (['lead_consents', 'lead_consent_events'] as $name) {
            Schema::create($name, function (Blueprint $table) use ($name) {
                $table->id();
                $table->foreignUlid('lead_id')->nullable()->constrained('leads')->nullOnDelete();
                $table->string('lead_identifier')->nullable();
                $table->string('lead_name')->nullable();
                $table->string('consent_type');
                $table->string('status');
                $table->string('source');
                $table->unsignedBigInteger('changed_by')->nullable();
                $table->string('changed_by_name')->nullable();
                $table->string('policy_version')->nullable();
                $table->string('policy_url', 500)->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->string('user_agent', 500)->nullable();
                $table->timestamp('occurred_at');
                $table->timestamps();

                if ($name === 'lead_consents') {
                    $table->unique(['lead_id', 'consent_type']);
                } else {
                    $table->index(['lead_id', 'occurred_at']);
                }
            });
        }

        Schema::create('lead_conversation_deletions', function (Blueprint $table) {
            $table->id();
            $table->string('lead_id');
            $table->string('lead_identifier')->nullable();
            $table->string('lead_name')->nullable();
            $table->string('channel')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->string('deleted_by_name')->nullable();
            $table->json('summary');
            $table->timestamps();
        });

    }

    public function down(): void
    {

        Schema::dropIfExists('lead_conversation_deletions');
        Schema::dropIfExists('lead_consent_events');
        Schema::dropIfExists('lead_consents');
        Schema::dropIfExists('messenger_message_templates');
        Schema::dropIfExists('whatsapp_message_templates');

        Schema::table('lead_messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('resend_message_id');
            $table->dropColumn(['attachment_path', 'attachment_mime', 'attachment_name', 'attachment_size', 'template_name', 'template_language', 'template_variables', 'activity_log_hidden_at']);
        });
    }
};
