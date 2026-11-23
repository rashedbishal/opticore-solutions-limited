<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Lead Management Phase 4B: duplicate detection and merging.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('email_normalized')->nullable()->index();
            $table->string('phone_normalized')->nullable()->index();
            // A merged-away lead stays (hidden) and points at the lead it
            // went into. Deleting that lead deletes the hidden one too.
            $table->foreignUlid('merged_into_lead_id')->nullable()->constrained('leads')->cascadeOnDelete();
            $table->timestamp('merged_at')->nullable();
        });

        DB::table('leads')->orderBy('id')->select(['id', 'email', 'phone'])->chunk(500, function ($leads): void {
            foreach ($leads as $lead) {
                $email = strtolower(trim((string) $lead->email));
                $phone = preg_replace('/\D+/', '', (string) $lead->phone);

                DB::table('leads')->where('id', $lead->id)->update([
                    'email_normalized' => $email === '' ? null : $email,
                    'phone_normalized' => $phone === '' || $phone === null ? null : $phone,
                ]);
            }
        });

        Schema::create('lead_duplicate_links', function (Blueprint $table) {
            $table->ulid('id')->primary();
            // The pair is stored with the smaller id first, so each pair
            // exists once.
            $table->foreignUlid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignUlid('duplicate_lead_id')->constrained('leads')->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->json('matched_fields');
            $table->timestamp('detected_at');
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->string('resolved_by_name')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->json('field_resolutions')->nullable();
            $table->timestamps();

            $table->unique(['lead_id', 'duplicate_lead_id']);
            $table->index('duplicate_lead_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_duplicate_links');

        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('merged_into_lead_id');
            $table->dropColumn(['email_normalized', 'phone_normalized', 'merged_at']);
        });
    }
};
