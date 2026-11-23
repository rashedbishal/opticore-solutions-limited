<?php

namespace App\Leads\Actions;

use App\Leads\Enums\LeadPriority;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadStatus;
use App\Leads\Services\LeadIntake;
use App\Models\Contact;

/**
 * Every Contact form submission also becomes a lead (the Contacts list is
 * kept as it is). A repeat sender creates a new lead each time.
 */
class CreateLeadFromContactForm
{
    public function __construct(private readonly LeadIntake $intake) {}

    public function handle(Contact $contact): Lead
    {
        $subject = trim((string) $contact->subject);
        $body = trim((string) $contact->message);

        $lead = Lead::create([
            'source_id' => LeadSource::ofType(LeadSourceType::ContactForm)->id,
            'status_id' => LeadStatus::initial()?->id,
            'priority' => LeadPriority::Medium,
            'name' => $contact->name,
            'email' => $contact->email,
            'phone' => $contact->phone ?: null,
            'message' => $subject !== '' ? "Subject: {$subject}\n\n{$body}" : $body,
            'source_data' => ['contact_id' => $contact->id],
        ]);

        $this->intake->received($lead);

        return $lead;
    }
}
