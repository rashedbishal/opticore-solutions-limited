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
        if (Schema::connection('meal')->hasTable('meal_settings')) {
            return;
        }

        Schema::connection('meal')->create('meal_settings', function (Blueprint $table) {
            $table->id();
            $table->time('accept_start_time')->nullable();
            $table->time('lock_time')->nullable();
            // Carbon's day-of-week numbering (0 = Sunday .. 6 = Saturday). Defaults to
            // Friday (5), the office's fixed weekly holiday.
            $table->unsignedTinyInteger('weekly_holiday_day')->default(5);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('meal')->dropIfExists('meal_settings');
    }
};
