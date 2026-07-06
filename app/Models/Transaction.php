<?php

namespace App\Models;

use App\Support\IdGenerator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class Transaction extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'category',
        'subcategory_id',
        'checkout_url',
        'invoice_number',
        'order_number',
        'transaction_id',
        'gateway_transaction_id',
        'val_id',
        'amount',
        'card_type',
        'store_amount',
        'card_no',
        'bank_tran_id',
        'status',
        'tran_date',
        'error',
        'currency',
        'card_issuer',
        'card_brand',
        'card_sub_brand',
        'card_issuer_country',
        'card_issuer_country_code',
        'store_id',
        'verify_sign',
        'verify_sign_sha2',
        'currency_type',
        'currency_amount',
        'currency_rate',
        'base_fair',
        'subscription_id',
        'risk_level',
        'risk_title',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'store_amount' => 'decimal:2',
            'currency_amount' => 'decimal:2',
            'currency_rate' => 'decimal:4',
            'base_fair' => 'decimal:2',
            'subcategory_id' => 'integer',
        ];
    }

    /**
     * Get the sub-category this transaction is related to.
     */
    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(PortfolioSubCategory::class, 'subcategory_id');
    }

    protected static function booted(): void
    {
        static::created(function (Transaction $transaction): void {
            if ($transaction->order_number) {
                return;
            }

            $transaction->forceFill([
                'order_number' => IdGenerator::orderNumber(),
            ])->saveQuietly();
        });

        // Covers every single-model create/update (including the
        // Pending -> Processing transition in SslCommerzPaymentController
        // that actually sets store_amount) and every single-model delete.
        // Bulk `Transaction::where(...)->delete()` calls (the admin "erase"
        // / "clear all" actions) bypass these events entirely, so those
        // call sites must forget the cache explicitly themselves.
        static::saved(fn () => self::forgetMonthlyPaymentCache());
        static::deleted(fn () => self::forgetMonthlyPaymentCache());
    }

    /**
     * Cache key for the current month's received-payment total. Scoping the
     * key by year-month means a new month starts with a guaranteed cache
     * miss (and therefore a fresh, correct total) without needing any
     * scheduled "reset" job.
     */
    public static function monthlyPaymentCacheKey(): string
    {
        return 'admin.dashboard.monthly-payment-received.'.now()->format('Y-m');
    }

    public static function forgetMonthlyPaymentCache(): void
    {
        Cache::forget(self::monthlyPaymentCacheKey());
    }
}
