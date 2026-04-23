<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sub_category_id')->nullable()->constrained('portfolio_sub_categories')->nullOnDelete();
            $table->enum('payment_type', ['single', 'milestone']);
            $table->text('description');
            $table->boolean('request_requirements')->default(true);
            $table->decimal('price', 10, 2)->nullable();
            $table->unsignedSmallInteger('delivery_days')->nullable();
            $table->unsignedSmallInteger('revisions')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->enum('status', ['pending', 'accepted', 'declined', 'expired'])->default('pending');
            $table->string('offer_token')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offers');
    }
};
