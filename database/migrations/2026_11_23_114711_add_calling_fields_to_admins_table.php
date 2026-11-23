<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * @var string|null
     */
    protected $connection = 'admin';

    /**
     * Backup call receiver (ticked by managers) and when this admin's
     * call box last checked in.
     */
    public function up(): void
    {
        if (Schema::connection('admin')->hasColumn('admins', 'is_whatsapp_backup_receiver')) {
            return;
        }

        Schema::connection('admin')->table('admins', function (Blueprint $table) {
            $table->boolean('is_whatsapp_backup_receiver')->default(false);
            $table->timestamp('softphone_last_seen_at')->nullable();
        });
    }

    public function down(): void
    {
        if (! Schema::connection('admin')->hasColumn('admins', 'is_whatsapp_backup_receiver')) {
            return;
        }

        Schema::connection('admin')->table('admins', function (Blueprint $table) {
            $table->dropColumn(['is_whatsapp_backup_receiver', 'softphone_last_seen_at']);
        });
    }
};
