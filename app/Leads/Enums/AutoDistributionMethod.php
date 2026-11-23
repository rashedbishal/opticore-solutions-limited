<?php

namespace App\Leads\Enums;

enum AutoDistributionMethod: string
{
    /** Agents take turns: whoever was assigned longest ago gets the next lead. */
    case RoundRobin = 'round_robin';

    /** The agent with the fewest open leads gets the next lead. */
    case LeastLoaded = 'least_loaded';

    case Random = 'random';

    public function label(): string
    {
        return match ($this) {
            self::RoundRobin => 'Take turns',
            self::LeastLoaded => 'Least busy',
            self::Random => 'Random',
        };
    }
}
