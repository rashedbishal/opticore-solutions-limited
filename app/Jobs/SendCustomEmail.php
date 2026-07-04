<?php

namespace App\Jobs;

use App\Mail\CustomMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Sends the admin-composed custom email and cleans up its attachment
 * uploads afterward. Dispatched from Admin/SubscriptionController::
 * sendCustomEmail instead of sending inline, so the admin's request isn't
 * blocked on the SMTP round-trip (especially with attachments).
 */
class SendCustomEmail implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [30, 60];

    /**
     * @param  array<int, string>  $to
     * @param  array<int, string>  $cc
     * @param  array<int, string>  $bcc
     * @param  array<int, array{path: string, name: string}>  $attachmentPaths
     */
    public function __construct(
        public array $to,
        public array $cc,
        public array $bcc,
        public string $emailSubject,
        public string $emailTitle,
        public string $body,
        public array $attachmentPaths,
    ) {}

    public function handle(): void
    {
        Mail::to($this->to)
            ->cc($this->cc)
            ->bcc($this->bcc)
            ->send(new CustomMail(
                emailSubject: $this->emailSubject,
                emailTitle: $this->emailTitle,
                body: $this->body,
                attachmentPaths: $this->attachmentPaths,
            ));

        $this->cleanupAttachments();
    }

    public function failed(Throwable $exception): void
    {
        Log::error('SendCustomEmail failed permanently', [
            'to' => $this->to,
            'error' => $exception->getMessage(),
        ]);

        $this->cleanupAttachments();
    }

    private function cleanupAttachments(): void
    {
        foreach ($this->attachmentPaths as $attachment) {
            Storage::disk('local')->delete($attachment['path']);
        }
    }
}
