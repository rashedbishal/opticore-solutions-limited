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
     * Section roles (client-facing, agency-operations,
     * management-administration) granted per admin by the mother admin.
     * Separate from `permissions`, which keeps gating individual modules.
     */
    public function up(): void
    {
        if (Schema::connection('admin')->hasColumn('admins', 'section_roles')) {
            return;
        }

        Schema::connection('admin')->table('admins', function (Blueprint $table) {
            $table->json('section_roles')->nullable()->after('permissions');
        });
    }

    public function down(): void
    {
        if (! Schema::connection('admin')->hasColumn('admins', 'section_roles')) {
            return;
        }

        Schema::connection('admin')->table('admins', function (Blueprint $table) {
            $table->dropColumn('section_roles');
        });
    }
};
