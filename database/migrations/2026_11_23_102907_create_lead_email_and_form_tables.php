<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lead Management Phase 2B: email inbox leads and the Website Form Builder.
 */
return new class extends Migration
{
    public function up(): void
    {
        // An email's formatted (HTML) version, shown in a locked-down preview.
        Schema::table('leads', function (Blueprint $table) {
            $table->longText('html_body')->nullable();
        });

        // Emails that failed to import, kept so they can be retried.
        Schema::create('failed_email_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('lead_source_id')->constrained('lead_sources')->cascadeOnDelete();
            $table->string('message_id')->nullable();
            $table->unsignedBigInteger('imap_uid');
            $table->unsignedBigInteger('uidvalidity');
            $table->string('status');
            $table->unsignedSmallInteger('attempts')->default(1);
            $table->string('failure_class')->nullable();
            $table->text('failure_reason')->nullable();
            $table->foreignUlid('partial_lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->string('partial_stage')->nullable();
            $table->boolean('is_new_lead')->nullable();
            $table->foreignUlid('resolved_lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->timestamp('first_failed_at');
            $table->timestamp('last_attempted_at')->nullable();
            $table->timestamp('next_retry_at')->nullable();
            $table->timestamp('recovered_at')->nullable();
            $table->string('subject', 500)->nullable();
            $table->string('from_email')->nullable();
            $table->timestamps();

            $table->unique(['lead_source_id', 'uidvalidity', 'imap_uid']);
            $table->index(['status', 'next_retry_at']);
        });

        Schema::create('website_forms', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_source_id')->constrained('lead_sources')->restrictOnDelete();
            $table->string('name');
            // Only a hash of the secret key is kept; the key is shown once.
            $table->string('token_hash', 64)->unique();
            $table->boolean('is_active')->default(true);
            // Websites allowed to send this form; empty = any website.
            $table->json('allowed_domains')->nullable();
            $table->timestamps();
        });

        Schema::create('website_form_fields', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('website_form_id')->constrained('website_forms')->cascadeOnDelete();
            $table->string('field_type');
            $table->string('fixed_field')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_form_fields');
        Schema::dropIfExists('website_forms');
        Schema::dropIfExists('failed_email_messages');

        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('html_body');
        });
    }
};
