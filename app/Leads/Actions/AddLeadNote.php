<?php

namespace App\Leads\Actions;

use App\Leads\Models\Lead;
use App\Leads\Models\LeadNote;
use App\Models\Admin;

class AddLeadNote
{
    public function handle(Lead $lead, string $note, Admin $actor): LeadNote
    {
        return LeadNote::create([
            'lead_id' => $lead->id,
            'admin_id' => $actor->id,
            'admin_name' => $actor->name,
            'note' => $note,
        ]);
    }
}
