<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Storage clean-up: files the mother admin removed sit here for 7 days so
 * they can be restored, then they're deleted for good.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('storage_recycle_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('disk', 20);
            $table->string('original_path', 1024);
            $table->string('bin_path', 1024);
            $table->unsignedBigInteger('size')->default(0);
            $table->string('deleted_by_name')->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('storage_recycle_items');
    }
};
