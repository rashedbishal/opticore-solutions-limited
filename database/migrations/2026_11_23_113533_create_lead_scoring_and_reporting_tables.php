<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lead Management Phase 4C: scoring rules, monthly source spend and
 * inactive-lead nurturing settings.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_scoring_rules', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('field');
            $table->string('operator');
            $table->json('value');
            $table->integer('points');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('leads', function (Blueprint $table) {
            // NULL = not scored (no active rules), never the same as 0.
            $table->unsignedTinyInteger('lead_score')->nullable()->index();
            $table->json('lead_score_breakdown')->nullable();
            $table->timestamp('lead_score_computed_at')->nullable();
            $table->timestamp('nurturing_task_created_at')->nullable();
        });

        // One spend figure per source per calendar month.
        Schema::create('lead_source_costs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_source_id')->constrained('lead_sources')->cascadeOnDelete();
            $table->date('month');
            $table->decimal('amount', 14, 2);
            $table->foreignUlid('currency_id')->constrained('currencies')->restrictOnDelete();
            $table->unsignedBigInteger('recorded_by')->nullable();
            $table->string('recorded_by_name')->nullable();
            $table->timestamps();

            $table->unique(['lead_source_id', 'month']);
        });

        Schema::table('lead_settings', function (Blueprint $table) {
            $table->boolean('nurturing_notify_enabled')->default(false);
            $table->boolean('nurturing_task_enabled')->default(false);
            $table->unsignedSmallInteger('nurturing_inactive_days')->default(7);
        });
    }

    public function down(): void
    {
        Schema::table('lead_settings', function (Blueprint $table) {
            $table->dropColumn(['nurturing_notify_enabled', 'nurturing_task_enabled', 'nurturing_inactive_days']);
        });
        Schema::dropIfExists('lead_source_costs');
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['lead_score', 'lead_score_breakdown', 'lead_score_computed_at', 'nurturing_task_created_at']);
        });
        Schema::dropIfExists('lead_scoring_rules');
    }
};
