<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The Website Form Builder was removed: Opticore's own Contact form already
 * feeds leads, and no forms on other websites are needed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('website_form_fields');
        Schema::dropIfExists('website_forms');

        // The shared "Website Forms" source only existed once a form was
        // made; remove it if it never brought in a lead.
        DB::table('lead_sources')
            ->where('type', 'website_form')
            ->whereNotExists(fn ($query) => $query->select(DB::raw(1))->from('leads')->whereColumn('leads.source_id', 'lead_sources.id'))
            ->delete();
    }

    public function down(): void
    {
        Schema::create('website_forms', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_source_id')->constrained('lead_sources')->restrictOnDelete();
            $table->string('name');
            $table->string('token_hash', 64)->unique();
            $table->boolean('is_active')->default(true);
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
};
