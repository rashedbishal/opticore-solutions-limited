<?php

namespace App\Leads\Models;

use App\Leads\Enums\EmailPartialFailureStage;
use App\Leads\Enums\FailedEmailMessageStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * An email that failed to import, kept so it can be retried with backoff.
 *
 * @property FailedEmailMessageStatus $status
 * @property EmailPartialFailureStage|null $partial_stage
 * @property int $attempts
 * @property int $imap_uid
 * @property int $uidvalidity
 * @property Carbon|null $next_retry_at
 */
class FailedEmailMessage extends Model
{
    protected $fillable = [
        'lead_source_id', 'message_id', 'imap_uid', 'uidvalidity', 'status', 'attempts', 'failure_class',
        'failure_reason', 'partial_lead_id', 'partial_stage', 'is_new_lead', 'resolved_lead_id', 'first_failed_at',
        'last_attempted_at', 'next_retry_at', 'recovered_at', 'subject', 'from_email',
    ];

    protected function casts(): array
    {
        return [
            'status' => FailedEmailMessageStatus::class,
            'partial_stage' => EmailPartialFailureStage::class,
            'attempts' => 'integer',
            'imap_uid' => 'integer',
            'uidvalidity' => 'integer',
            'is_new_lead' => 'boolean',
            'first_failed_at' => 'datetime',
            'last_attempted_at' => 'datetime',
            'next_retry_at' => 'datetime',
            'recovered_at' => 'datetime',
        ];
    }
}
