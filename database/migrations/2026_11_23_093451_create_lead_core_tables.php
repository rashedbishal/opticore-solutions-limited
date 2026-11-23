<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Lead Management core (Phase 1). Admins live on the separate `admin`
 * connection, so every admin reference here is a plain bigint without a
 * foreign key (the same approach as `tasks`), plus a name snapshot where
 * history must stay readable after that admin is deleted.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Single-row settings (mother admin → Lead Settings → General).
        Schema::create('lead_settings', function (Blueprint $table) {
            $table->id();
            $table->string('distribution_mode')->default('manual');
            $table->string('auto_distribution_method')->nullable();
            $table->string('lead_id_prefix')->default('OCS');
            $table->unsignedInteger('next_lead_number')->default(1);
            $table->boolean('meeting_alert_enabled')->default(false);
            $table->unsignedSmallInteger('meeting_alert_days_before')->default(0);
            $table->boolean('followup_alert_enabled')->default(false);
            $table->unsignedSmallInteger('followup_alert_days_before')->default(0);
            $table->timestamps();
        });

        DB::table('lead_settings')->insert(['created_at' => now(), 'updated_at' => now()]);

        Schema::create('lead_sources', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('type');
            $table->string('name');
            $table->text('config')->nullable();
            $table->boolean('is_active')->default(true);
            // Set only for one-per-system source types (manual, contact form)
            // so the unique index makes a duplicate impossible.
            $table->string('singleton_type')->nullable()->unique();
            $table->timestamps();
        });

        foreach ([['manual', 'Manual'], ['contact_form', 'Website Contact Form']] as [$type, $name]) {
            DB::table('lead_sources')->insert([
                'id' => (string) Str::ulid(),
                'type' => $type,
                'name' => $name,
                'is_active' => true,
                'singleton_type' => $type,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Which agents may see a source's unowned leads (mother admin ticks
        // these per agent on the admin form).
        Schema::create('lead_source_unassigned_viewers', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('lead_source_id')->constrained('lead_sources')->cascadeOnDelete();
            $table->unsignedBigInteger('admin_id')->index();
            $table->timestamps();

            $table->unique(['lead_source_id', 'admin_id']);
        });

        // Round-robin / least-busy bookkeeping per admin.
        Schema::create('lead_agent_states', function (Blueprint $table) {
            $table->unsignedBigInteger('admin_id')->primary();
            // Microsecond precision: leads arriving within the same second must
            // still take turns correctly.
            $table->timestamp('last_assigned_at', 6)->nullable();
            $table->timestamps();
        });

        Schema::create('leads', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('identifier')->unique();
            $table->foreignUlid('source_id')->constrained('lead_sources')->restrictOnDelete();
            $table->unsignedBigInteger('assigned_to')->nullable()->index();
            $table->timestamp('assigned_at')->nullable();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('message')->nullable();
            $table->json('source_data')->nullable();
            $table->foreignUlid('status_id')->constrained('lead_statuses')->restrictOnDelete();
            $table->string('priority')->default('medium');
            $table->string('company')->nullable();
            $table->string('website')->nullable();
            $table->string('industry')->nullable();
            $table->string('location')->nullable();
            $table->string('service_interest')->nullable();
            $table->string('lead_source')->nullable();
            $table->decimal('estimated_budget', 12, 2)->nullable();
            $table->foreignUlid('estimated_budget_currency_id')->nullable()->constrained('currencies')->restrictOnDelete();
            $table->decimal('deal_value', 12, 2)->nullable();
            $table->foreignUlid('deal_value_currency_id')->nullable()->constrained('currencies')->restrictOnDelete();
            $table->unsignedSmallInteger('win_probability')->nullable();
            $table->date('next_follow_up_at')->nullable();
            $table->date('meeting_date')->nullable();
            $table->time('meeting_time')->nullable();
            $table->timestamp('first_contacted_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamp('update_seen_at')->nullable();
            $table->timestamps();

            $table->index('status_id');
            $table->index('created_at');
        });

        Schema::create('lead_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->unsignedBigInteger('changed_by')->nullable();
            $table->string('changed_by_name')->nullable();
            $table->foreignUlid('old_status_id')->nullable()->constrained('lead_statuses')->restrictOnDelete();
            $table->foreignUlid('new_status_id')->constrained('lead_statuses')->restrictOnDelete();
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('lead_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->unsignedBigInteger('admin_id')->nullable();
            $table->string('admin_name')->nullable();
            $table->text('note');
            $table->timestamps();
        });

        Schema::create('lead_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->unsignedBigInteger('assigned_to');
            $table->string('assigned_to_name')->nullable();
            $table->unsignedBigInteger('assigned_by')->nullable();
            $table->string('assigned_by_name')->nullable();
            $table->string('assignment_note')->nullable();
            $table->timestamps();
        });

        Schema::create('lead_detail_update_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->unsignedBigInteger('changed_by')->nullable();
            $table->string('changed_by_name')->nullable();
            $table->json('changed_fields');
            $table->string('action')->nullable();
            $table->date('action_date')->nullable();
            $table->timestamps();
        });

        Schema::create('lead_deletion_audits', function (Blueprint $table) {
            $table->id();
            $table->string('lead_id');
            $table->string('lead_identifier')->nullable();
            $table->string('lead_name')->nullable();
            $table->string('lead_email')->nullable();
            $table->string('lead_phone')->nullable();
            $table->string('source_type')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->string('deleted_by_name')->nullable();
            $table->boolean('is_bulk')->default(false);
            $table->json('cascade_summary')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_deletion_audits');
        Schema::dropIfExists('lead_detail_update_logs');
        Schema::dropIfExists('lead_assignments');
        Schema::dropIfExists('lead_notes');
        Schema::dropIfExists('lead_status_logs');
        Schema::dropIfExists('leads');
        Schema::dropIfExists('lead_agent_states');
        Schema::dropIfExists('lead_source_unassigned_viewers');
        Schema::dropIfExists('lead_sources');
        Schema::dropIfExists('lead_settings');
    }
};
