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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('client_name');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('category');
            $table->foreignId('sub_category_id')->nullable()->constrained('portfolio_sub_categories')->nullOnDelete();
            $table->string('task_name');
            $table->date('date');
            $table->enum('state', ['pending', 'in progress', 'delivered'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
