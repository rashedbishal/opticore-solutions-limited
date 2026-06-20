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
            $table->string('original_email')->nullable()->after('email');
        });

        // Accounts already soft-deleted before this fix still hold their
        // real, un-mangled email, which would collide with the unique index
        // the moment someone re-registers with it. Free those emails now so
        // the new invariant (trashed rows never occupy a reusable email)
        // holds for pre-existing data too.
        DB::table('users')
            ->whereNotNull('deleted_at')
            ->orderBy('id')
            ->chunkById(100, function ($users) {
                foreach ($users as $user) {
                    DB::table('users')->where('id', $user->id)->update([
                        'original_email' => $user->email,
                        'email' => "deleted-user-{$user->id}@deleted.invalid",
                    ]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('original_email');
        });
    }
};
