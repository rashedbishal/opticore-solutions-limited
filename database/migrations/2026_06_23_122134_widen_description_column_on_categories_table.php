<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * `description` was `varchar(255)` (Laravel's default string length)
     * while StoreCategoryRequest/UpdateCategoryRequest have always allowed
     * up to 500 characters — Postgres rejects the insert/update outright
     * (unlike MySQL's non-strict-mode silent truncation) once a value
     * exceeds the column's actual length, surfacing as an unhandled 500.
     * `text` removes the mismatch entirely instead of just raising the cap
     * to match today's validation, so a future validation change can't
     * reintroduce the same bug — same choice already made for
     * `long_description` on this table.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->text('description')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('description', 255)->nullable()->change();
        });
    }
};
