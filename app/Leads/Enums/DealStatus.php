<?php

namespace App\Leads\Enums;

enum DealStatus: string
{
    case Open = 'open';
    case Won = 'won';
    case Lost = 'lost';

    public function label(): string
    {
        return ucfirst($this->value);
    }

    /** A deal can't go straight between Won and Lost; it goes back to Open first. */
    public function canTransitionTo(self $target): bool
    {
        return $target !== $this && ! ($this !== self::Open && $target !== self::Open);
    }
}
