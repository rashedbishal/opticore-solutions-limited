<?php

namespace App\Jobs;

use App\Models\Contact;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

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
        // Place heavy operations here, like API calls or sending emails to admin/client
        // Mail::to('admin@opticore.com')->send(new ContactMessageMail($this->contact));
    }
}
