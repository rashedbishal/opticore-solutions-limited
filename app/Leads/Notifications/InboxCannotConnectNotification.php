<?php

namespace App\Leads\Notifications;

use App\Leads\Models\LeadSource;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent once to the mother admin (bell + email) when an email lead inbox
 * has failed to connect several times in a row.
 */
class InboxCannotConnectNotification extends Notification
{
    public function __construct(public LeadSource $source, public int $failures) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'lead_source_id' => $this->source->id,
            'source_name' => $this->source->name,
            'failures' => $this->failures,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Lead email inbox can't connect: {$this->source->name}")
            ->line("The CMS has failed to connect to the \"{$this->source->name}\" email inbox {$this->failures} times in a row, so new emails aren't becoming leads.")
            ->line('Check the inbox password and IMAP settings, then use "Test connection".')
            ->action('Open Lead Sources', route('admin.leads.sources.index'));
    }
}
