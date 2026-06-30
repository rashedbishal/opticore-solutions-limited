<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        DB::statement('CREATE INDEX IF NOT EXISTS orders_name_trgm_idx ON orders USING gin (name gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS orders_email_trgm_idx ON orders USING gin (email gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS orders_phone_trgm_idx ON orders USING gin (phone gin_trgm_ops)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS orders_name_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS orders_email_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS orders_phone_trgm_idx');
    }
};
