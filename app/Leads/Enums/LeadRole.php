<?php

namespace App\Leads\Enums;

/**
 * An admin's role in Lead Management, chosen by the mother admin on the
 * admin create/edit form. The mother admin is always treated as a Manager
 * without holding a stored role (see Admin::leadRole()).
 */
enum LeadRole: string
{
    /** Sees and works only the leads assigned to them. */
    case Agent = 'agent';

    /** Sees every lead, can delete, receives manager alerts and fallback calls. */
    case Manager = 'manager';

    public function label(): string
    {
        return match ($this) {
            self::Agent => 'Leads – Agent',
            self::Manager => 'Leads – Manager',
        };
    }
}
