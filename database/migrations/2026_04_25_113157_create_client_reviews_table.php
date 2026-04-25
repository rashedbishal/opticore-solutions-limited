<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('client_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sub_category_id')->constrained('portfolio_sub_categories')->cascadeOnDelete();
            $table->string('category_slug');
            $table->string('username');
            $table->enum('client_type', ['new', 'repeat'])->default('new');
            $table->tinyInteger('rating');
            $table->text('comment');
            $table->string('image_path')->nullable();
            $table->string('price_range')->nullable();
            $table->string('work_duration')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_reviews');
    }
};
