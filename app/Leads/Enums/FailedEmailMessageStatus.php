<?php

namespace App\Leads\Enums;

enum FailedEmailMessageStatus: string
{
    /** Will be retried. */
    case Failed = 'failed';

    /** Gave up after the retry limit (or the email disappeared). */
    case Exhausted = 'exhausted';

    /** A retry succeeded. */
    case Recovered = 'recovered';
}
