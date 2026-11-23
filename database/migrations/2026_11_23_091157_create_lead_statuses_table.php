<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * The starting pipeline, identical to OptiFin's default catalog
     * (order, colours and which statuses close a lead).
     *
     * @var array<int, array{slug: string, name: string, color: string, is_closed: bool}>
     */
    private array $defaults = [
        ['slug' => 'new', 'name' => 'New', 'color' => 'blue', 'is_closed' => false],
        ['slug' => 'contacted', 'name' => 'Contacted', 'color' => 'sky', 'is_closed' => false],
        ['slug' => 'qualified', 'name' => 'Qualified', 'color' => 'indigo', 'is_closed' => false],
        ['slug' => 'proposal-sent', 'name' => 'Proposal Sent', 'color' => 'amber', 'is_closed' => false],
        ['slug' => 'negotiation', 'name' => 'Negotiation', 'color' => 'orange', 'is_closed' => false],
        ['slug' => 'won', 'name' => 'Won', 'color' => 'green', 'is_closed' => true],
        ['slug' => 'lost', 'name' => 'Lost', 'color' => 'red', 'is_closed' => true],
        ['slug' => 'unqualified', 'name' => 'Unqualified', 'color' => 'zinc', 'is_closed' => true],
    ];

    public function up(): void
    {
        Schema::create('lead_statuses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('color');
            $table->boolean('is_closed')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();

        foreach ($this->defaults as $index => $status) {
            DB::table('lead_statuses')->insert([
                'id' => (string) Str::ulid(),
                ...$status,
                'sort_order' => $index + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_statuses');
    }
};
