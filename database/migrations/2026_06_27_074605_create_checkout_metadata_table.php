<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checkout_metadata', function (Blueprint $table) {
            $table->id();
            // Nullable UUID set when the client pre-uploads files before payment.
            $table->string('upload_token')->unique()->nullable()->index();
            // Set during payViaAjax / charge once we know the transaction ID.
            $table->string('transaction_id')->unique()->nullable()->index();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            // [{path, original_name, mime_type, size}]
            $table->json('attachment_paths')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checkout_metadata');
    }
};
