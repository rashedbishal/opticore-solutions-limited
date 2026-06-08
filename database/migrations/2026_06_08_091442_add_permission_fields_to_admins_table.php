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
    protected $connection = 'admin';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::connection('admin')->hasColumn('admins', 'is_super_admin')) {
            return;
        }

        Schema::connection('admin')->table('admins', function (Blueprint $table) {
            $table->boolean('is_super_admin')->default(false)->after('email');
            $table->boolean('full_access')->default(false)->after('is_super_admin');
            $table->json('permissions')->nullable()->after('full_access');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::connection('admin')->hasColumn('admins', 'is_super_admin')) {
            return;
        }

        Schema::connection('admin')->table('admins', function (Blueprint $table) {
            $table->dropColumn(['is_super_admin', 'full_access', 'permissions']);
        });
    }
};
