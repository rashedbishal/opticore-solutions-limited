<?php

use App\Leads\Mail\ImapClient;

/**
 * An in-memory mailbox standing in for a real IMAP server in tests.
 */
class FakeImapClient implements ImapClient
{
    /** @var array<int, array{uid: int, header: object|false, structure: object|false, parts: array<string, string>, seen: bool}> */
    public array $messages = [];

    public bool $canConnect = true;

    public int $uidValidity = 1;

    public function addEmail(string $fromEmail, ?string $fromName, string $subject, string $text, ?string $html = null, array $attachments = [], ?string $messageId = null): int
    {
        $number = count($this->messages) + 1;
        [$mailbox, $host] = explode('@', $fromEmail);
        $from = (object) ['mailbox' => $mailbox, 'host' => $host];

        if ($fromName !== null) {
            $from->personal = $fromName;
        }

        $parts = [];
        $structureParts = [(object) ['type' => 0, 'subtype' => 'PLAIN', 'encoding' => 0]];
        $parts['1'] = $text;

        if ($html !== null) {
            $structureParts[] = (object) ['type' => 0, 'subtype' => 'HTML', 'encoding' => 0];
            $parts[(string) count($structureParts)] = $html;
        }

        foreach ($attachments as $attachment) {
            $structureParts[] = (object) [
                'type' => 5, 'subtype' => 'PNG', 'encoding' => 3, 'bytes' => strlen($attachment['bytes']),
                'dparameters' => [(object) ['attribute' => 'filename', 'value' => $attachment['name']]],
            ];
            $parts[(string) count($structureParts)] = base64_encode($attachment['bytes']);
        }

        $this->messages[$number] = [
            'uid' => 100 + $number,
            'header' => (object) ['from' => [$from], 'subject' => $subject, 'message_id' => $messageId ?? "<msg{$number}@test>", 'date' => now()->toRfc2822String()],
            'structure' => (object) ['type' => 1, 'subtype' => 'MIXED', 'parts' => $structureParts],
            'parts' => $parts,
            'seen' => false,
        ];

        return $number;
    }

    public function open(string $mailbox, string $username, string $password, bool $halfOpen = false): ?object
    {
        return $this->canConnect ? new stdClass : null;
    }

    public function lastError(): string
    {
        return 'Authentication failed';
    }

    public function uidValidity(object $connection, string $mailbox): int
    {
        return $this->uidValidity;
    }

    public function searchUnseen(object $connection): array
    {
        return array_keys(array_filter($this->messages, fn (array $m): bool => ! $m['seen']));
    }

    public function headerInfo(object $connection, int $messageNumber): object|false
    {
        return $this->messages[$messageNumber]['header'] ?? false;
    }

    public function uid(object $connection, int $messageNumber): int|false
    {
        return $this->messages[$messageNumber]['uid'] ?? false;
    }

    public function messageNumber(object $connection, int $uid): int
    {
        foreach ($this->messages as $number => $message) {
            if ($message['uid'] === $uid) {
                return $number;
            }
        }

        return 0;
    }

    public function structure(object $connection, int $messageNumber): object|false
    {
        return $this->messages[$messageNumber]['structure'] ?? false;
    }

    public function body(object $connection, int $messageNumber, string $partNumber): string|false
    {
        return $this->messages[$messageNumber]['parts'][$partNumber] ?? false;
    }

    public function markSeen(object $connection, int $messageNumber): void
    {
        $this->messages[$messageNumber]['seen'] = true;
    }

    public function close(object $connection): void {}
}
