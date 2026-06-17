<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class CustomMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $emailSubject,
        public string $emailTitle,
        public string $body,
        public array $attachmentPaths = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->emailSubject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.custom');
    }

    public function attachments(): array
    {
        return array_map(
            fn (array $att) => Attachment::fromPath(
                Storage::disk('local')->path($att['path'])
            )->as($att['name']),
            $this->attachmentPaths,
        );
    }
}
