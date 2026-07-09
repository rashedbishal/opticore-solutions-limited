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
        if (Schema::connection('meal')->hasTable('meal_items')) {
            return;
        }

        // One row per calendar day — the "reset every day" requirement falls
        // out naturally from the date being the key, no scheduled reset job
        // needed. admin_id is a plain column, not a real FK: it points at
        // the `admin` connection's admins table, which lives in a separate
        // database and can't be constrained across connections.
        Schema::connection('meal')->create('meal_items', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->string('item_name')->nullable();
            $table->unsignedBigInteger('set_by_admin_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('meal')->dropIfExists('meal_items');
    }
};
