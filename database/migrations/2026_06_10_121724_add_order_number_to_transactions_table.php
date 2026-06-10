<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('order_number')->nullable()->unique()->after('transaction_id');
        });

        DB::table('transactions')->orderBy('id')->select('id')->cursor()->each(function (object $transaction): void {
            DB::table('transactions')
                ->where('id', $transaction->id)
                ->update(['order_number' => 'ORD-'.str_pad((string) $transaction->id, 6, '0', STR_PAD_LEFT)]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('order_number');
        });
    }
};
