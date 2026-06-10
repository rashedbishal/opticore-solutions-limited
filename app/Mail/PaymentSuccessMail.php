<?php

namespace App\Mail;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Transaction $transaction,
        public string $pdfContent,
        public ?string $serviceName = null,
        public ?string $categoryName = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Payment Confirmed — Invoice #'.$this->transaction->invoice_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment_success',
            with: [
                'transaction' => $this->transaction,
                'serviceName' => $this->serviceName,
                'categoryName' => $this->categoryName,
            ],
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromData(
                fn () => $this->pdfContent,
                'Invoice-'.$this->transaction->invoice_number.'.pdf'
            )->withMime('application/pdf'),
        ];
    }
}
