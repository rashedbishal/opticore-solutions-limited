<?php

namespace App\Jobs;

use App\Mail\ContactMessageMail;
use App\Models\Contact;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class ProcessContactMessage implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [30, 60];

    public function __construct(
        public Contact $contact
    ) {}

    public function handle(): void
    {
        Mail::to(config('mail.from.address'))->send(new ContactMessageMail($this->contact));
    }

    public function failed(Throwable $exception): void
    {
        Log::error('ProcessContactMessage failed permanently', [
            'contact_id' => $this->contact->id,
            'contact_email' => $this->contact->email,
            'error' => $exception->getMessage(),
        ]);
    }
}
