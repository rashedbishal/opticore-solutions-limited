<?php

namespace App\Mail;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Task $task,
        public string $recipientName,
    ) {}

    public function envelope(): Envelope
    {
        $subject = match ($this->task->state) {
            'pending' => 'Your Order Has Been Received — '.$this->task->task_name,
            'in progress' => 'Work Has Started on Your Order — '.$this->task->task_name,
            'delivered' => 'Your Order Has Been Delivered — '.$this->task->task_name,
            default => 'Order Update — '.$this->task->task_name,
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.task_status',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
