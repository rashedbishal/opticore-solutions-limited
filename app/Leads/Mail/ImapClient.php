<?php

namespace App\Leads\Mail;

/**
 * The few IMAP operations the email lead importer needs. The real
 * implementation wraps PHP's imap extension; tests use a fake mailbox.
 * `$connection` is whatever open() returned.
 */
interface ImapClient
{
    public function open(string $mailbox, string $username, string $password, bool $halfOpen = false): ?object;

    public function lastError(): string;

    public function uidValidity(object $connection, string $mailbox): int;

    /**
     * @return array<int, int> message numbers of unread emails
     */
    public function searchUnseen(object $connection): array;

    public function headerInfo(object $connection, int $messageNumber): object|false;

    public function uid(object $connection, int $messageNumber): int|false;

    public function messageNumber(object $connection, int $uid): int;

    public function structure(object $connection, int $messageNumber): object|false;

    public function body(object $connection, int $messageNumber, string $partNumber): string|false;

    public function markSeen(object $connection, int $messageNumber): void;

    public function close(object $connection): void;
}
