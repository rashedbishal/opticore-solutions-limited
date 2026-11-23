<?php

namespace App\Leads\Services;

use App\Leads\Events\LeadReceived;
use App\Leads\Models\Lead;
use App\Leads\Notifications\NewLeadNotification;
use App\Models\Admin;

/**
 * What happens when a lead arrives by itself (Contact form, and later the
 * chat/ads/email channels), in this order: automatic assignment (if
 * switched on), the "new lead" alerts, then the live refresh. Runs exactly
 * once per lead, right after it is created. Leads added by hand never come
 * through here (same as OptiFin: no "new lead" alert for them).
 */
class LeadIntake
{
    public function __construct(
        private readonly LeadAssignmentService $assignment,
        private readonly LeadPeople $people,
    ) {}

    public function received(Lead $lead): void
    {
        if ($lead->assigned_to === null) {
            $this->assignment->autoAssign($lead);
            $lead->refresh();
        }

        $notification = new NewLeadNotification($lead->loadMissing('source'));
        $notified = [];

        foreach ($this->people->managers() as $manager) {
            $manager->notify($notification);
            $notified[] = (int) $manager->id;
        }

        // Agents allowed to see this source's unowned leads hear about it the
        // moment it lands unowned.
        if ($lead->assigned_to === null) {
            $viewerIds = array_diff($lead->source->unassignedViewerIds(), $notified);

            if ($viewerIds !== []) {
                $this->people->agentsQuery()->whereKey($viewerIds)->get()
                    ->each(fn (Admin $agent) => $agent->notify($notification));
            }
        }

        LeadReceived::dispatch($lead->id);
    }
}
