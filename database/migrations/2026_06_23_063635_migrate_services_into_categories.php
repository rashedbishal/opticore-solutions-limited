<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Folds the now-retired `services` / `service_portfolio_items` tables
     * (matched to `categories` by identical slug) into the new marketing
     * columns on `categories` / `category_portfolio_items`, then drops the
     * old tables. On a fresh install `services` won't exist yet (or will
     * be empty), so this is a no-op there.
     */
    public function up(): void
    {
        if (! Schema::hasTable('services')) {
            return;
        }

        foreach (DB::table('services')->get() as $service) {
            DB::table('categories')->where('slug', $service->slug)->update([
                'icon' => $service->icon,
                'long_description' => $service->long_description,
                'headings' => $service->headings,
                'sub_services' => $service->sub_services,
                'reasons' => $service->reasons,
                'process' => $service->process,
                'is_active' => $service->is_active,
            ]);

            $category = DB::table('categories')->where('slug', $service->slug)->first();

            if (! $category) {
                continue;
            }

            $items = DB::table('service_portfolio_items')->where('service_id', $service->id)->get();

            foreach ($items as $item) {
                DB::table('category_portfolio_items')->insert([
                    'category_id' => $category->id,
                    'title' => $item->title,
                    'category' => $item->category,
                    'description' => $item->description,
                    'image' => $item->image,
                    'alt' => $item->alt,
                    'sort_order' => $item->sort_order,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                ]);
            }
        }

        Schema::dropIfExists('service_portfolio_items');
        Schema::dropIfExists('services');
    }

    /**
     * Irreversible: the source `services` / `service_portfolio_items` rows
     * are gone once dropped. Restoring the split would mean re-running the
     * original `create_services_table` / `create_service_portfolio_items_table`
     * migrations and reseeding from scratch.
     */
    public function down(): void
    {
        //
    }
};
