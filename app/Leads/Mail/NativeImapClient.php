<?php

namespace App\Leads\Mail;

use IMAP\Connection;

/**
 * ImapClient backed by PHP's imap extension (php8.3-imap on the server).
 */
class NativeImapClient implements ImapClient
{
    public function open(string $mailbox, string $username, string $password, bool $halfOpen = false): ?object
    {
        $connection = @imap_open($mailbox, $username, $password, $halfOpen ? OP_HALFOPEN : 0);

        if (! $connection instanceof Connection) {
            return null;
        }

        return $connection;
    }

    public function lastError(): string
    {
        $error = (string) imap_last_error();

        // Clear the extension's queued notices so they don't leak into later calls.
        imap_errors();
        imap_alerts();

        return $error;
    }

    public function uidValidity(object $connection, string $mailbox): int
    {
        $status = imap_status($this->c($connection), $mailbox, SA_UIDVALIDITY);

        return $status !== false ? (int) $status->uidvalidity : 0;
    }

    public function searchUnseen(object $connection): array
    {
        return array_map('intval', imap_search($this->c($connection), 'UNSEEN') ?: []);
    }

    public function headerInfo(object $connection, int $messageNumber): object|false
    {
        return imap_headerinfo($this->c($connection), $messageNumber);
    }

    public function uid(object $connection, int $messageNumber): int|false
    {
        return imap_uid($this->c($connection), $messageNumber);
    }

    public function messageNumber(object $connection, int $uid): int
    {
        return (int) imap_msgno($this->c($connection), $uid);
    }

    public function structure(object $connection, int $messageNumber): object|false
    {
        return imap_fetchstructure($this->c($connection), $messageNumber);
    }

    public function body(object $connection, int $messageNumber, string $partNumber): string|false
    {
        return imap_fetchbody($this->c($connection), $messageNumber, $partNumber);
    }

    public function markSeen(object $connection, int $messageNumber): void
    {
        imap_setflag_full($this->c($connection), (string) $messageNumber, '\\Seen');
    }

    public function close(object $connection): void
    {
        imap_errors();
        imap_alerts();
        imap_close($this->c($connection));
    }

    private function c(object $connection): Connection
    {
        /** @var Connection $connection */
        return $connection;
    }
}
