<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OfferMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $imagePath,
        public string $imageName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Special Offer — Opticore Solutions');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.offer');
    }

    public function attachments(): array
    {
        return [];
    }
}
