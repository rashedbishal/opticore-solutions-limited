<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Lead Management Phase 4B: importing leads from a CSV or Excel file.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('lead_sources')->insert([
            'id' => (string) Str::ulid(),
            'type' => 'csv_import',
            'name' => 'Imported File',
            'is_active' => true,
            'singleton_type' => 'csv_import',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::create('lead_imports', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type', 8);
            $table->string('status')->default('pending');
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('processed_rows')->default(0);
            $table->unsignedInteger('imported_count')->default(0);
            $table->unsignedInteger('duplicate_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            // Where the next batch starts: a byte offset (CSV) or a sheet
            // row (Excel), plus the file row number reached (CSV).
            $table->unsignedBigInteger('cursor')->default(0);
            $table->unsignedInteger('cursor_row')->default(1);
            $table->unsignedBigInteger('imported_by')->nullable();
            $table->string('imported_by_name')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
        });

        Schema::create('lead_import_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('lead_import_id')->constrained('lead_imports')->cascadeOnDelete();
            $table->unsignedInteger('row_number');
            $table->string('status');
            $table->json('data');
            $table->json('errors')->nullable();
            $table->string('email_normalized')->nullable();
            $table->string('phone_normalized')->nullable();
            $table->foreignUlid('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->string('duplicate_of')->nullable();
            $table->timestamps();

            $table->unique(['lead_import_id', 'row_number']);
            $table->index(['lead_import_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_import_rows');
        Schema::dropIfExists('lead_imports');
        DB::table('lead_sources')->where('singleton_type', 'csv_import')->delete();
    }
};
