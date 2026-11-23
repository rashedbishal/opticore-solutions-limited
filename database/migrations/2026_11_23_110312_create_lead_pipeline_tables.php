<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lead Management Phase 4A: tags, deals, tasks and custom fields. Lead
 * tasks use their own lead_tasks table (the CMS already has a `tasks`
 * table for client workflow).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_tags', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('color');
            $table->timestamps();
        });

        Schema::create('lead_lead_tag', function (Blueprint $table) {
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignUlid('lead_tag_id')->constrained('lead_tags')->cascadeOnDelete();
            $table->unsignedBigInteger('tagged_by')->nullable();
            $table->timestamps();

            $table->primary(['lead_id', 'lead_tag_id']);
        });

        Schema::create('deals', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->string('name');
            $table->decimal('value', 12, 2)->nullable();
            $table->foreignUlid('currency_id')->nullable()->constrained('currencies')->restrictOnDelete();
            $table->unsignedSmallInteger('probability')->nullable();
            $table->string('status')->default('open');
            $table->date('expected_close_date')->nullable();
            $table->date('actual_close_date')->nullable();
            $table->unsignedBigInteger('owner_id')->nullable();
            $table->string('owner_name')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'status']);
        });

        Schema::create('deal_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('deal_id')->constrained('deals')->cascadeOnDelete();
            $table->unsignedBigInteger('changed_by')->nullable();
            $table->string('changed_by_name')->nullable();
            $table->string('old_status')->nullable();
            $table->string('new_status');
            $table->timestamps();
        });

        Schema::create('lead_tasks', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignUlid('deal_id')->nullable()->constrained('deals')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->time('due_time')->nullable();
            $table->string('priority')->default('medium');
            $table->string('status')->default('pending');
            $table->timestamp('closed_at')->nullable();
            $table->unsignedBigInteger('assigned_to')->nullable()->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'status']);
        });

        Schema::create('lead_task_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('lead_task_id')->constrained('lead_tasks')->cascadeOnDelete();
            $table->unsignedBigInteger('changed_by')->nullable();
            $table->string('changed_by_name')->nullable();
            $table->string('old_status')->nullable();
            $table->string('new_status');
            $table->timestamps();
        });

        Schema::create('lead_custom_field_definitions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('key')->unique();
            $table->string('type');
            $table->json('options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // One row per lead and field; an empty value is never stored.
        Schema::create('lead_custom_field_values', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignUlid('lead_custom_field_definition_id')->constrained('lead_custom_field_definitions')->cascadeOnDelete();
            $table->text('value');
            $table->timestamps();

            $table->unique(['lead_id', 'lead_custom_field_definition_id']);
        });

        Schema::table('lead_settings', function (Blueprint $table) {
            $table->boolean('task_alert_enabled')->default(false);
            $table->unsignedSmallInteger('task_alert_days_before')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('lead_settings', function (Blueprint $table) {
            $table->dropColumn(['task_alert_enabled', 'task_alert_days_before']);
        });

        foreach (['lead_custom_field_values', 'lead_custom_field_definitions', 'lead_task_status_logs', 'lead_tasks', 'deal_status_logs', 'deals', 'lead_lead_tag', 'lead_tags'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
