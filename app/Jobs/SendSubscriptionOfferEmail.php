<?php

namespace App\Jobs;

use App\Mail\OfferMail;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Sends one chunk of the subscriber list as a BCC batch. Dispatched in
 * chunks (see Admin/SubscriptionController::sendOfferEmail) rather than one
 * email with every subscriber on the BCC line, since mail providers commonly
 * cap recipients per message; running it on the queue also keeps the admin's
 * request from blocking on the SMTP round-trip for the whole subscriber list.
 * Batchable is required so the controller's Bus::batch(...)->finally(...)
 * only deletes the temp upload once every chunk has run.
 */
class SendSubscriptionOfferEmail implements ShouldQueue
{
    use Batchable, Queueable;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [30, 60];

    /**
     * @param  array<int, string>  $subscriberEmails
     */
    public function __construct(
        public string $companyEmail,
        public array $subscriberEmails,
        public string $imagePath,
        public string $imageName,
    ) {}

    public function handle(): void
    {
        Mail::to($this->companyEmail)
            ->bcc($this->subscriberEmails)
            ->send(new OfferMail($this->imagePath, $this->imageName));
    }

    public function failed(Throwable $exception): void
    {
        Log::error('SendSubscriptionOfferEmail failed permanently', [
            'subscriber_count' => count($this->subscriberEmails),
            'error' => $exception->getMessage(),
        ]);
    }
}
