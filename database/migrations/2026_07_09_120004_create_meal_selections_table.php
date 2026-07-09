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
        if (Schema::connection('meal')->hasTable('meal_selections')) {
            return;
        }

        Schema::connection('meal')->create('meal_selections', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            // Not a real FK — points at the `admin` connection's admins
            // table, which lives in a separate database.
            $table->unsignedBigInteger('admin_id');
            $table->string('status'); // 'accepted' | 'declined'
            $table->boolean('is_auto_declined')->default(false);
            $table->timestamp('decided_at')->nullable();
            $table->unsignedBigInteger('overridden_by_admin_id')->nullable();
            $table->timestamp('overridden_at')->nullable();
            $table->timestamps();

            $table->unique(['date', 'admin_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('meal')->dropIfExists('meal_selections');
    }
};
