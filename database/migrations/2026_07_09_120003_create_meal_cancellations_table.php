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
        if (Schema::connection('meal')->hasTable('meal_cancellations')) {
            return;
        }

        Schema::connection('meal')->create('meal_cancellations', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->string('note');
            $table->unsignedBigInteger('cancelled_by_admin_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('meal')->dropIfExists('meal_cancellations');
    }
};
