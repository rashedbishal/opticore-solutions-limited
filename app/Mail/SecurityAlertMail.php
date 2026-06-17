<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SecurityAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $recipientName,
        public string $type, // 'login' | 'password_change'
        public string $ip,
        public string $userAgent,
        public string $time,
    ) {}

    public function envelope(): Envelope
    {
        $subject = match ($this->type) {
            'login' => 'New Login to Your Opticore Account',
            'password_change' => 'Your Opticore Account Password Was Changed',
            default => 'Security Alert — Opticore Account',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.security_alert');
    }

    public function attachments(): array
    {
        return [];
    }
}
