<?php

namespace App\Jobs;

use App\Mail\PaymentSuccessMail;
use App\Models\PortfolioSubCategory;
use App\Models\Transaction;
use App\Support\InvoicePdfBuilder;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Renders the invoice PDF (headless-Chrome via Browsershot) and emails it.
 * Dispatched from the SSLCommerz success/IPN handlers instead of running
 * inline, since spawning Chrome per request blocked both the customer's
 * redirect and the gateway's IPN webhook response.
 */
class SendPaymentInvoiceEmail implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [30, 60];

    public function __construct(
        public Transaction $transaction
    ) {}

    public function handle(): void
    {
        if (! $this->transaction->email) {
            return;
        }

        $subcategory = $this->transaction->subcategory_id
            ? PortfolioSubCategory::find($this->transaction->subcategory_id)
            : null;

        $serviceName = $subcategory?->name;
        $categoryName = $this->transaction->category
            ? ucwords(str_replace('-', ' ', $this->transaction->category))
            : null;

        $pdfContent = InvoicePdfBuilder::cachedContent($this->transaction);

        Mail::to($this->transaction->email)->send(
            new PaymentSuccessMail($this->transaction, $pdfContent, $serviceName, $categoryName)
        );
    }

    public function failed(Throwable $exception): void
    {
        Log::error('SendPaymentInvoiceEmail failed permanently', [
            'transaction_id' => $this->transaction->transaction_id,
            'email' => $this->transaction->email,
            'error' => $exception->getMessage(),
        ]);
    }
}
