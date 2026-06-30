<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->index('user_id', 'tasks_user_id_idx');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->index('last_message_at', 'conversations_last_message_at_idx');
        });

        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        DB::statement('CREATE INDEX IF NOT EXISTS transactions_name_trgm_idx ON transactions USING gin (name gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS transactions_phone_trgm_idx ON transactions USING gin (phone gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS tasks_client_name_trgm_idx ON tasks USING gin (client_name gin_trgm_ops)');
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex('tasks_user_id_idx');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropIndex('conversations_last_message_at_idx');
        });

        DB::statement('DROP INDEX IF EXISTS transactions_name_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS transactions_phone_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS tasks_client_name_trgm_idx');
    }
};
