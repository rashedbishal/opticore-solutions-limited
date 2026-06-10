<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
