<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'label',
        'description',
        'sort_order',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    /**
     * Cached category list keyed by slug, in the same shape as the former
     * config('portfolio.categories') array.
     *
     * @return array<string, array{label: string, description: string|null}>
     */
    public static function configShape(): array
    {
        return Cache::remember('categories.config-shape', now()->addMinutes(60), function () {
            return self::query()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->mapWithKeys(fn (Category $category) => [
                    $category->slug => [
                        'label' => $category->label,
                        'description' => $category->description,
                    ],
                ])
                ->toArray();
        });
    }
}
