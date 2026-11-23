<?php

namespace App\Leads\Models;

use Database\Factories\Leads\CurrencyFactory;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A currency offered on lead money fields (budget, deal value, source
 * cost). Managed by the mother admin at Lead Settings → Currencies.
 */
#[UseFactory(CurrencyFactory::class)]
class Currency extends Model
{
    /** @use HasFactory<CurrencyFactory> */
    use HasFactory, HasUlids;

    protected $fillable = ['code', 'name'];

    /**
     * Whether anything references this currency, which blocks deleting it.
     * Nothing can reference a currency until leads, deals and source costs
     * exist; those checks are added together with those tables.
     */
    public function isInUse(): bool
    {
        return false;
    }
}
