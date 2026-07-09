<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The connection name for the migration.
     *
     * @var string|null
     */
    protected $connection = 'meal';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::connection('meal')->hasTable('meal_holidays')) {
            return;
        }

        Schema::connection('meal')->create('meal_holidays', function (Blueprint $table) {
            $table->id();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('note')->nullable();
            $table->unsignedBigInteger('created_by_admin_id')->nullable();
            $table->timestamps();

            $table->index(['start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('meal')->dropIfExists('meal_holidays');
    }
};
