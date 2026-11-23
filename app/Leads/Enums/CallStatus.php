<?php

namespace App\Leads\Enums;

/**
 * A WhatsApp call's life, as in OptiFin: Ringing → Answering → Connected →
 * Completed, or ending Missed / Rejected / Failed. Every change is one
 * conditional update, so two people can never both "win" a call.
 */
enum CallStatus: string
{
    case Initiated = 'initiated';
    case Ringing = 'ringing';
    case Answering = 'answering';
    case Connected = 'connected';
    case Completed = 'completed';
    case Missed = 'missed';
    case Rejected = 'rejected';
    case Failed = 'failed';

    /**
     * @return array<int, string>
     */
    public static function activeValues(): array
    {
        return array_values(array_map(fn (self $s): string => $s->value, array_filter(self::cases(), fn (self $s): bool => $s->isActive())));
    }

    public function isActive(): bool
    {
        return in_array($this, [self::Initiated, self::Ringing, self::Answering, self::Connected], true);
    }

    public function isTerminal(): bool
    {
        return ! $this->isActive();
    }

    /**
     * @return array<int, self>
     */
    public function allowedNext(): array
    {
        return match ($this) {
            self::Initiated => [self::Ringing, self::Failed],
            self::Ringing => [self::Answering, self::Rejected, self::Missed, self::Failed],
            self::Answering => [self::Connected, self::Completed, self::Missed, self::Rejected, self::Failed],
            self::Connected => [self::Completed, self::Failed],
            self::Completed, self::Missed, self::Rejected, self::Failed => [],
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedNext(), true);
    }

    public function label(): string
    {
        return match ($this) {
            self::Initiated => 'Starting',
            self::Ringing => 'Ringing',
            self::Answering => 'Answering',
            self::Connected => 'On call',
            self::Completed => 'Completed',
            self::Missed => 'Missed',
            self::Rejected => 'Declined',
            self::Failed => 'Failed',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Initiated, self::Ringing, self::Answering => 'sky',
            self::Connected => 'emerald',
            self::Completed => 'green',
            self::Missed => 'amber',
            self::Rejected => 'zinc',
            self::Failed => 'red',
        };
    }
}
