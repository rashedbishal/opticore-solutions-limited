<?php

namespace App\Leads\Enums;

enum TaskStatus: string
{
    case Pending = 'pending';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return ucfirst($this->value);
    }

    /** A task can't go straight between Completed and Cancelled; it goes back to Pending first. */
    public function canTransitionTo(self $target): bool
    {
        return $target !== $this && ! ($this !== self::Pending && $target !== self::Pending);
    }
}
