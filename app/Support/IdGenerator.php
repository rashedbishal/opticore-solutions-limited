<?php

namespace App\Support;

use App\Models\Transaction;
use Illuminate\Support\Str;

class IdGenerator
{
    public static function transactionId(): string
    {
        do {
            $id = 'TRX-'.strtoupper(Str::random(12));
        } while (Transaction::where('transaction_id', $id)->exists());

        return $id;
    }

    public static function invoiceNumber(): string
    {
        do {
            $number = 'INV-'.now()->format('Ym').'-'.strtoupper(Str::random(5));
        } while (Transaction::where('invoice_number', $number)->exists());

        return $number;
    }

    public static function orderNumber(): string
    {
        $prefix = 'ORD-'.now()->format('Ym').'-';

        $sequence = Transaction::where('order_number', 'like', $prefix.'%')->count();

        do {
            $sequence++;
            $number = $prefix.str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
        } while (Transaction::where('order_number', $number)->exists());

        return $number;
    }
}
