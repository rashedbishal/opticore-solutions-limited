<?php

namespace App\Leads\Enums;

/**
 * How far an email got before failing, after its lead was already saved —
 * so a retry finishes the job instead of creating a second lead.
 */
enum EmailPartialFailureStage: string
{
    /** Lead saved; alerts/live refresh not sent yet. */
    case Event = 'event';

    /** Lead saved and announced; attachments not saved yet. */
    case Attachments = 'attachments';
}
