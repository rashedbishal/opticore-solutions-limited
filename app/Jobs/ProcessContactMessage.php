<?php

namespace App\Jobs;

use App\Mail\ContactMessageMail;
use App\Models\Contact;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class ProcessContactMessage implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Contact $contact
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Mail::to(config('mail.from.address'))->send(new ContactMessageMail($this->contact));
    }
}
