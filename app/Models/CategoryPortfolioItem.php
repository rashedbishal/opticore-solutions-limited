<?php

namespace App\Models;

use Database\Factories\CategoryPortfolioItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CategoryPortfolioItem extends Model
{
    /** @use HasFactory<CategoryPortfolioItemFactory> */
    use HasFactory;

    protected $fillable = [
        'category_id',
        'title',
        'category',
        'description',
        'image',
        'alt',
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
     * Named to avoid colliding with the `category` column (the small tag
     * label, e.g. "Brand Video") — Eloquent would otherwise always resolve
     * `$item->category` to the column, never this relation.
     */
    public function parentCategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}
