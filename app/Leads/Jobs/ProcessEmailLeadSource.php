<?php

namespace App\Leads\Jobs;

use App\Leads\Enums\EmailPartialFailureStage;
use App\Leads\Enums\FailedEmailMessageStatus;
use App\Leads\Enums\LeadAttachmentStatus;
use App\Leads\Enums\LeadPriority;
use App\Leads\Events\LeadUpdated;
use App\Leads\Exceptions\EmailMessagePartiallyProcessed;
use App\Leads\Mail\ImapClient;
use App\Leads\Models\FailedEmailMessage;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadStatus;
use App\Leads\Services\InboxHealth;
use App\Leads\Services\LeadIntake;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Mime\MimeTypes;
use Throwable;

/**
 * Reads unread emails from one email lead inbox and turns each into a lead
 * (or adds it to the sender's existing lead), the same way OptiFin does.
 * Each email is marked read only once its outcome is safely recorded; a
 * failed email is kept in failed_email_messages and retried with backoff.
 * With $retryFailedMessageIds set, it retries those records instead.
 */
class ProcessEmailLeadSource implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 180;

    private const MAX_MESSAGES_PER_RUN = 25;

    private const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

    private const MAX_RETRY_ATTEMPTS = 5;

    private const RETRY_BACKOFF_MINUTES = 15;

    /** A part whose reported size is this much over the limit is refused unread (base64 overhead). */
    private const ATTACHMENT_PRE_FETCH_REJECT_MULTIPLIER = 1.34;

    private const IMAP_PRIMARY_TYPES = [
        0 => 'text', 1 => 'multipart', 2 => 'message', 3 => 'application',
        4 => 'audio', 5 => 'image', 6 => 'video', 7 => 'other',
    ];

    private ImapClient $imap;

    /**
     * @param  array<int, int>|null  $retryFailedMessageIds
     */
    public function __construct(public LeadSource $source, public ?array $retryFailedMessageIds = null) {}

    /**
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [(new WithoutOverlapping((string) $this->source->id))->releaseAfter(30)->expireAfter($this->timeout)];
    }

    public function handle(ImapClient $imap, InboxHealth $health): void
    {
        $this->imap = $imap;
        $config = $this->source->config ?? [];
        $mailbox = self::mailboxString($config);
        $inbox = $imap->open($mailbox, (string) ($config['imap_username'] ?? ''), (string) ($config['imap_password'] ?? ''));

        if ($inbox === null) {
            Log::error("Unable to connect to lead source [{$this->source->id}]: {$imap->lastError()}");
            $health->recordFailure($this->source);

            return;
        }

        $health->recordSuccess($this->source);
        $uidvalidity = $imap->uidValidity($inbox, $mailbox);

        $this->retryFailedMessageIds !== null
            ? $this->handleRetries($inbox, $uidvalidity)
            : $this->handleUnseen($inbox, $uidvalidity);

        $imap->close($inbox);

        if ($this->retryFailedMessageIds === null) {
            $this->source->update(['last_synced_at' => now()]);
        }
    }

    /**
     * @param  array<string, mixed>  $config
     */
    public static function mailboxString(array $config): string
    {
        return sprintf('{%s:%d/imap/ssl}INBOX', $config['imap_host'] ?? '', (int) ($config['imap_port'] ?? 993));
    }

    private function handleUnseen(object $inbox, int $uidvalidity): void
    {
        $numbers = $this->imap->searchUnseen($inbox);
        sort($numbers);

        foreach (array_slice($numbers, 0, self::MAX_MESSAGES_PER_RUN) as $number) {
            $header = $this->imap->headerInfo($inbox, $number);

            try {
                if ($header === false) {
                    throw new RuntimeException("Unable to read headers for message [{$number}].");
                }

                $this->createLeadFromEmail($inbox, $number, $header);
            } catch (Throwable $e) {
                Log::error("Failed to process email message [{$number}] on lead source [{$this->source->id}]: {$e->getMessage()}");

                // If the failure can't be recorded, leave the email unread so
                // the next run tries it again.
                if (! $this->recordNewFailure($inbox, $number, $uidvalidity, $header !== false ? $header : null, $e)) {
                    continue;
                }
            }

            $this->imap->markSeen($inbox, $number);
        }
    }

    private function recordNewFailure(object $inbox, int $number, int $uidvalidity, ?object $header, Throwable $e): bool
    {
        $uid = $this->imap->uid($inbox, $number);

        if ($uid === false || $uid === 0) {
            return false;
        }

        $partial = $e instanceof EmailMessagePartiallyProcessed ? $e : null;
        $from = $header->from[0] ?? null;

        try {
            $existing = FailedEmailMessage::query()
                ->where('lead_source_id', $this->source->id)
                ->where('uidvalidity', $uidvalidity)
                ->where('imap_uid', $uid)
                ->first();

            $common = [
                'status' => FailedEmailMessageStatus::Failed,
                'failure_class' => $this->classify($header, $e),
                'failure_reason' => Str::limit($e->getMessage(), 1000),
                'partial_lead_id' => $partial?->leadId,
                'partial_stage' => $partial?->stage,
                'is_new_lead' => $partial?->isNewLead,
                'last_attempted_at' => now(),
            ];

            if ($existing !== null) {
                $existing->update([...$common, 'attempts' => $existing->attempts + 1, 'next_retry_at' => now()->addMinutes(self::RETRY_BACKOFF_MINUTES * ($existing->attempts + 1))]);
            } else {
                FailedEmailMessage::create([
                    ...$common,
                    'lead_source_id' => $this->source->id,
                    'message_id' => $this->messageId($header->message_id ?? null),
                    'imap_uid' => $uid,
                    'uidvalidity' => $uidvalidity,
                    'attempts' => 1,
                    'first_failed_at' => now(),
                    'next_retry_at' => now()->addMinutes(self::RETRY_BACKOFF_MINUTES),
                    'subject' => isset($header->subject) ? Str::limit((string) $header->subject, 480) : null,
                    'from_email' => $from !== null ? "{$from->mailbox}@{$from->host}" : null,
                ]);
            }

            return true;
        } catch (Throwable $recording) {
            Log::error("Could not record the failure for message [{$number}] on lead source [{$this->source->id}]: {$recording->getMessage()}");

            return false;
        }
    }

    private function classify(?object $header, Throwable $e): string
    {
        return match (true) {
            $header === null => 'permanent_unreadable_header',
            $e instanceof QueryException => 'transient_db',
            default => 'unknown',
        };
    }

    private function handleRetries(object $inbox, int $uidvalidity): void
    {
        FailedEmailMessage::query()
            ->whereIn('id', $this->retryFailedMessageIds ?? [])
            ->where('status', FailedEmailMessageStatus::Failed)
            ->get()
            ->each(fn (FailedEmailMessage $record) => $this->retryOne($inbox, $uidvalidity, $record));
    }

    private function retryOne(object $inbox, int $uidvalidity, FailedEmailMessage $record): void
    {
        if ($record->fresh()?->status !== FailedEmailMessageStatus::Failed) {
            return;
        }

        if ($record->uidvalidity !== $uidvalidity) {
            $this->exhaust($record, 'The mailbox changed since this failure was recorded; the original email can no longer be safely located.');

            return;
        }

        $number = $this->imap->messageNumber($inbox, $record->imap_uid);

        if ($number === 0) {
            $this->exhaust($record, 'The original email is no longer in the mailbox.');

            return;
        }

        $header = $this->imap->headerInfo($inbox, $number);

        if ($header === false) {
            $this->recordRetryFailure($record, 'Unable to re-read headers for this email on retry.');
            $this->imap->markSeen($inbox, $number);

            return;
        }

        $currentId = $this->messageId($header->message_id ?? null);

        if ($record->message_id !== null && $currentId !== null && $record->message_id !== $currentId) {
            $this->exhaust($record, 'The email at this position is no longer the same email; refusing to import a different one.');

            return;
        }

        try {
            if ($record->partial_lead_id !== null) {
                $lead = Lead::query()->withMerged()->findOrFail($record->partial_lead_id)->latestVersion();
                $this->finishLead($lead, $record->partial_stage === EmailPartialFailureStage::Attachments, (bool) $record->is_new_lead, $inbox, $number, $this->imap->structure($inbox, $number), $this->sentAt($header));
            } else {
                $lead = $this->createLeadFromEmail($inbox, $number, $header);
            }

            $record->update(['status' => FailedEmailMessageStatus::Recovered, 'recovered_at' => now(), 'resolved_lead_id' => $lead->id, 'last_attempted_at' => now()]);
        } catch (EmailMessagePartiallyProcessed $e) {
            $this->recordRetryFailure($record, $e->getMessage(), $e->leadId, $e->stage);
        } catch (Throwable $e) {
            $this->recordRetryFailure($record, $e->getMessage());
        }

        $this->imap->markSeen($inbox, $number);
    }

    private function recordRetryFailure(FailedEmailMessage $record, string $reason, ?string $partialLeadId = null, ?EmailPartialFailureStage $stage = null): void
    {
        $attempts = $record->attempts + 1;
        $exhausted = $attempts >= self::MAX_RETRY_ATTEMPTS;

        $record->update([
            'attempts' => $attempts,
            'failure_reason' => Str::limit($reason, 1000),
            'partial_lead_id' => $partialLeadId ?? $record->partial_lead_id,
            'partial_stage' => $stage ?? $record->partial_stage,
            'last_attempted_at' => now(),
            'status' => $exhausted ? FailedEmailMessageStatus::Exhausted : FailedEmailMessageStatus::Failed,
            'next_retry_at' => $exhausted ? null : now()->addMinutes(self::RETRY_BACKOFF_MINUTES * $attempts),
        ]);
    }

    private function exhaust(FailedEmailMessage $record, string $reason): void
    {
        $record->update(['status' => FailedEmailMessageStatus::Exhausted, 'failure_reason' => $reason, 'last_attempted_at' => now(), 'next_retry_at' => null]);
        Log::error("Email retry abandoned (failed email [{$record->id}]) on lead source [{$this->source->id}]: {$reason}");
    }

    private function createLeadFromEmail(object $inbox, int $number, object $header): Lead
    {
        $structure = $this->imap->structure($inbox, $number);
        $body = $structure !== false ? $this->extractBody($inbox, $number, $structure) : ['message' => '', 'html' => null];
        $from = $header->from[0] ?? null;
        $email = $from !== null ? "{$from->mailbox}@{$from->host}" : null;
        $name = $from->personal ?? $email ?? 'Unknown Sender';
        $subject = isset($header->subject) ? $this->decodeHeader((string) $header->subject) : null;

        $existing = $email !== null
            ? Lead::query()->withMerged()->where('source_id', $this->source->id)->where('email', $email)->first()?->latestVersion()
            : null;

        if ($existing !== null) {
            $personal = $header->from[0]->personal ?? null;

            if ($existing->name === $email && is_string($personal) && $personal !== '') {
                $existing->name = $this->decodeHeader($personal);
            }

            $text = trim($body['message']);

            if ($text !== '') {
                $existing->message = trim(($existing->message ?? '')."\n".$text);
            }

            if ($body['html'] !== null) {
                $existing->html_body = $body['html'];
            }

            $existing->source_data = [...($existing->source_data ?? []), 'subject' => $subject ?? ($existing->source_data['subject'] ?? null)];
            $existing->save();

            $this->finishLead($existing, false, false, $inbox, $number, $structure, $this->sentAt($header));

            return $existing;
        }

        $lead = DB::transaction(fn (): Lead => Lead::create([
            'source_id' => $this->source->id,
            'status_id' => LeadStatus::initial()?->id,
            'priority' => LeadPriority::Medium,
            'name' => is_string($name) ? $this->decodeHeader($name) : 'Unknown Sender',
            'email' => $email,
            'message' => trim($body['message']),
            'html_body' => $body['html'],
            'source_data' => ['subject' => $subject],
        ]));

        $this->finishLead($lead, false, true, $inbox, $number, $structure, $this->sentAt($header));

        return $lead;
    }

    /**
     * The steps after the lead is saved: announce it (alerts + live refresh)
     * and save attachments. A failure here is tagged with its stage so a
     * retry resumes rather than duplicating the lead.
     */
    private function finishLead(Lead $lead, bool $alreadyAnnounced, bool $isNewLead, object $inbox, int $number, object|false $structure, CarbonInterface $sentAt): void
    {
        if (! $alreadyAnnounced) {
            try {
                $isNewLead ? app(LeadIntake::class)->received($lead) : LeadUpdated::dispatch($lead->id);
            } catch (Throwable $e) {
                throw new EmailMessagePartiallyProcessed($lead->id, EmailPartialFailureStage::Event, $isNewLead, $e);
            }
        }

        try {
            if ($structure !== false) {
                foreach ($this->attachmentParts($structure) as $part) {
                    $this->saveAttachment($inbox, $number, $part, $lead, $sentAt);
                }
            }
        } catch (Throwable $e) {
            throw new EmailMessagePartiallyProcessed($lead->id, EmailPartialFailureStage::Attachments, $isNewLead, $e);
        }
    }

    private function sentAt(object $header): CarbonInterface
    {
        try {
            return isset($header->date) && is_string($header->date) && $header->date !== '' ? Carbon::parse($header->date) : now();
        } catch (Throwable) {
            return now();
        }
    }

    private function messageId(mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }

    private function decodeHeader(string $value): string
    {
        $decoded = function_exists('iconv_mime_decode') ? @iconv_mime_decode($value, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8') : false;

        return is_string($decoded) && $decoded !== '' ? $decoded : $value;
    }

    /**
     * @return array{message: string, html: string|null}
     */
    private function extractBody(object $inbox, int $number, object $structure): array
    {
        ['plain' => $plain, 'html' => $html] = $this->textParts($structure);
        $htmlBody = $html !== null ? $this->decodedPart($inbox, $number, $html[0], $html[1]) : null;

        $message = match (true) {
            $plain !== null => $this->decodedPart($inbox, $number, $plain[0], $plain[1]),
            $htmlBody !== null => html_entity_decode(strip_tags($htmlBody), ENT_QUOTES | ENT_HTML5),
            default => '',
        };

        return ['message' => $this->tidy($message), 'html' => $htmlBody];
    }

    private function decodedPart(object $inbox, int $number, ?string $partNumber, int $encoding): string
    {
        $raw = (string) $this->imap->body($inbox, $number, $partNumber ?? '1');

        return match ($encoding) {
            3 => base64_decode($raw) ?: $raw,
            4 => quoted_printable_decode($raw),
            default => $raw,
        };
    }

    /**
     * Removes invisible padding characters marketing emails add to defeat
     * preview clipping, and collapses the resulting blank space.
     */
    private function tidy(string $text): string
    {
        $text = preg_replace('/[\p{Cf}\x{034F}]/u', '', $text) ?? $text;
        $lines = array_map(
            fn (string $line): string => trim(preg_replace('/[\p{Zs}\t]{2,}/u', ' ', $line) ?? $line),
            preg_split('/\r\n|\r|\n/', $text) ?: [$text],
        );

        return trim(preg_replace('/\n{3,}/', "\n\n", implode("\n", $lines)) ?? implode("\n", $lines));
    }

    /**
     * The first plain-text and HTML parts, as [part number, encoding].
     *
     * @return array{plain: array{0: string|null, 1: int}|null, html: array{0: string|null, 1: int}|null}
     */
    private function textParts(object $structure, string $prefix = ''): array
    {
        if (empty($structure->parts)) {
            $part = [$prefix !== '' ? $prefix : null, (int) ($structure->encoding ?? 0)];

            return strtoupper($structure->subtype ?? '') === 'HTML' ? ['plain' => null, 'html' => $part] : ['plain' => $part, 'html' => null];
        }

        $plain = null;
        $html = null;

        foreach ($structure->parts as $index => $part) {
            $partNumber = $prefix === '' ? (string) ($index + 1) : $prefix.'.'.($index + 1);

            if ((int) $part->type === 1) {
                $found = $this->textParts($part, $partNumber);
                $plain ??= $found['plain'];
                $html ??= $found['html'];

                continue;
            }

            if ((int) $part->type !== 0 || $this->filename($part) !== null) {
                continue;
            }

            $subtype = strtoupper($part->subtype ?? '');

            if ($subtype === 'PLAIN') {
                $plain ??= [$partNumber, (int) ($part->encoding ?? 0)];
            } elseif ($subtype === 'HTML') {
                $html ??= [$partNumber, (int) ($part->encoding ?? 0)];
            }
        }

        return ['plain' => $plain, 'html' => $html];
    }

    /**
     * @return array<int, array{part_number: string, encoding: int, mime: string, filename: string|null, bytes: int|null}>
     */
    private function attachmentParts(object $structure, string $prefix = ''): array
    {
        if (empty($structure->parts)) {
            return [];
        }

        $found = [];

        foreach ($structure->parts as $index => $part) {
            $partNumber = $prefix === '' ? (string) ($index + 1) : $prefix.'.'.($index + 1);

            if ((int) $part->type === 1) {
                $found = [...$found, ...$this->attachmentParts($part, $partNumber)];

                continue;
            }

            $filename = $this->filename($part);

            if (in_array(strtoupper($part->subtype ?? ''), ['PLAIN', 'HTML'], true) && $filename === null) {
                continue;
            }

            $found[] = [
                'part_number' => $partNumber,
                'encoding' => (int) ($part->encoding ?? 0),
                'mime' => (self::IMAP_PRIMARY_TYPES[(int) ($part->type ?? 3)] ?? 'application').'/'.strtolower($part->subtype ?? 'octet-stream'),
                'filename' => $filename,
                'bytes' => isset($part->bytes) && is_numeric($part->bytes) ? (int) $part->bytes : null,
            ];
        }

        return $found;
    }

    private function filename(object $part): ?string
    {
        foreach ([...($part->dparameters ?? []), ...($part->parameters ?? [])] as $param) {
            if (in_array(strtolower($param->attribute ?? ''), ['filename', 'name'], true)) {
                return (string) $param->value;
            }
        }

        return null;
    }

    /**
     * @param  array{part_number: string, encoding: int, mime: string, filename: string|null, bytes: int|null}  $part
     */
    private function saveAttachment(object $inbox, int $number, array $part, Lead $lead, CarbonInterface $sentAt): void
    {
        $type = match (true) {
            str_starts_with($part['mime'], 'image/') => 'image',
            str_starts_with($part['mime'], 'video/') => 'video',
            str_starts_with($part['mime'], 'audio/') => 'audio',
            default => 'file',
        };

        $fail = fn (string $reason) => $lead->attachments()->create(['type' => $type, 'status' => LeadAttachmentStatus::Failed, 'failure_reason' => $reason, 'sent_at' => $sentAt]);

        if ($part['bytes'] !== null && $part['bytes'] > self::MAX_ATTACHMENT_BYTES * self::ATTACHMENT_PRE_FETCH_REJECT_MULTIPLIER) {
            $fail('Attachment exceeds the '.self::MAX_ATTACHMENT_BYTES.'-byte limit.');

            return;
        }

        $bytes = $this->decodedPart($inbox, $number, $part['part_number'], $part['encoding']);

        if ($bytes === '' || strlen($bytes) > self::MAX_ATTACHMENT_BYTES) {
            $fail($bytes === '' ? 'Attachment was empty after decoding.' : 'Attachment exceeds the '.self::MAX_ATTACHMENT_BYTES.'-byte limit.');

            return;
        }

        $extension = $part['filename'] !== null && pathinfo($part['filename'], PATHINFO_EXTENSION) !== ''
            ? strtolower(pathinfo($part['filename'], PATHINFO_EXTENSION))
            : (MimeTypes::getDefault()->getExtensions($part['mime'])[0] ?? 'bin');

        $path = 'leads/email/'.Str::ulid().'.'.preg_replace('/[^a-z0-9]/', '', $extension);
        Storage::disk('local')->put($path, $bytes);

        $lead->attachments()->create(['type' => $type, 'path' => $path, 'mime' => $part['mime'], 'status' => LeadAttachmentStatus::Downloaded, 'sent_at' => $sentAt]);
    }
}
