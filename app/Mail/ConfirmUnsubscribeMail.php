<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConfirmUnsubscribeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $confirmUrl) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Confirm Unsubscribe From Opticore Solutions Newsletter');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.confirm_unsubscribe');
    }

    public function attachments(): array
    {
        return [];
    }
}
