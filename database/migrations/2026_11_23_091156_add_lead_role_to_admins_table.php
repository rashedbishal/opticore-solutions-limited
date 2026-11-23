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
     * Lead Management role (agent|manager), chosen per admin by the mother
     * admin. Deliberately separate from `permissions`/`full_access` so that
     * "full access" never grants a lead role implicitly.
     */
    public function up(): void
    {
        if (Schema::connection('admin')->hasColumn('admins', 'lead_role')) {
            return;
        }

        Schema::connection('admin')->table('admins', function (Blueprint $table) {
            $table->string('lead_role')->nullable()->after('permissions');
        });
    }

    public function down(): void
    {
        if (! Schema::connection('admin')->hasColumn('admins', 'lead_role')) {
            return;
        }

        Schema::connection('admin')->table('admins', function (Blueprint $table) {
            $table->dropColumn('lead_role');
        });
    }
};
