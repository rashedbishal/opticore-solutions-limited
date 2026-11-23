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
     * Whether any lead money field or deal uses this currency, which blocks
     * deleting it.
     */
    public function isInUse(): bool
    {
        return Lead::query()
            ->where('estimated_budget_currency_id', $this->id)
            ->orWhere('deal_value_currency_id', $this->id)
            ->exists()
            || Deal::query()->where('currency_id', $this->id)->exists()
            || LeadSourceCost::query()->where('currency_id', $this->id)->exists();
    }
}
