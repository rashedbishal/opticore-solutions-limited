<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ManageSubscriptionFromProfileMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $recipientName) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Manage Your Newsletter Preference');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.manage_subscription_from_profile');
    }

    public function attachments(): array
    {
        return [];
    }
}
