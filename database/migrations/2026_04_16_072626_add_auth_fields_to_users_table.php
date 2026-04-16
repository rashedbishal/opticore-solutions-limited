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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone_number')->nullable()->after('email');
            $table->string('google_id')->nullable()->after('password')->index();
            $table->string('facebook_id')->nullable()->after('google_id')->index();
            $table->string('avatar')->nullable()->after('facebook_id');
            $table->string('role')->default('user')->after('avatar'); // user, admin
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone_number', 'google_id', 'facebook_id', 'avatar', 'role']);
        });
    }
};
