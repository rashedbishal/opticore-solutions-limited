<?php

use App\Jobs\SendPaymentInvoiceEmail;
use App\Mail\PaymentSuccessMail;
use App\Models\PortfolioSubCategory;
use App\Models\Transaction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

function createInvoiceableTransaction(array $overrides = []): Transaction
{
    return Transaction::create(array_merge([
        'name' => 'Test Customer',
        'email' => 'customer@example.com',
        'phone' => '0123456789',
        'address' => 'Test address',
        'checkout_url' => '/checkout',
        'transaction_id' => 'TXN-'.uniqid(),
        'amount' => '100',
        'currency' => 'USD',
        'status' => 'Processing',
        'invoice_number' => 'INV-'.uniqid(),
    ], $overrides));
}

it('is queued rather than run inline, since it renders the invoice PDF via headless Chrome', function () {
    expect(new SendPaymentInvoiceEmail(createInvoiceableTransaction()))
        ->toBeInstanceOf(ShouldQueue::class);
});

it('renders the invoice pdf and emails it to the transaction owner', function () {
    Mail::fake();

    $subCategory = PortfolioSubCategory::factory()->create(['name' => 'Logo Design']);

    $transaction = createInvoiceableTransaction([
        'category' => 'graphic-design',
        'subcategory_id' => $subCategory->id,
    ]);

    (new SendPaymentInvoiceEmail($transaction))->handle();

    Mail::assertSent(PaymentSuccessMail::class, function (PaymentSuccessMail $mail) use ($transaction) {
        return $mail->hasTo($transaction->email)
            && $mail->transaction->is($transaction)
            && $mail->serviceName === 'Logo Design'
            && $mail->categoryName === 'Graphic Design'
            && str_starts_with($mail->pdfContent, '%PDF');
    });

    Storage::disk('local')->assertExists('invoices/'.$transaction->invoice_number.'.pdf');
});

it('does nothing when the transaction has no email on file', function () {
    Mail::fake();

    $transaction = createInvoiceableTransaction(['email' => null]);

    (new SendPaymentInvoiceEmail($transaction))->handle();

    Mail::assertNothingSent();
});
