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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notify_promotional_emails')->default(false)->after('notify_security_alerts');
        });

        // Existing users who already subscribed via the footer before this
        // preference existed should show as subscribed, not reset to off.
        DB::table('users')
            ->whereIn('email', DB::table('subscriptions')->pluck('email'))
            ->update(['notify_promotional_emails' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('notify_promotional_emails');
        });
    }
};
