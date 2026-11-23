<?php

use App\Jobs\ProcessContactMessage;
use App\Leads\Actions\CreateLeadFromContactForm;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Events\LeadReceived;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Leads\Notifications\NewLeadNotification;
use App\Models\Admin;
use App\Models\Contact;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;

function submitContactForm(array $overrides = [])
{
    return test()->post('/api/contact', [
        'name' => 'Karim Uddin',
        'email' => 'karim@example.com',
        'phone' => '01711000000',
        'subject' => 'Website redesign',
        'message' => 'We need a new website.',
        ...$overrides,
    ]);
}

beforeEach(function () {
    Queue::fake([ProcessContactMessage::class]);
});

it('keeps the contact message and also creates a lead from it', function () {
    Event::fake([LeadReceived::class]);

    submitContactForm()->assertSessionHas('success');

    $contact = Contact::firstOrFail();
    $lead = Lead::firstOrFail();

    expect($lead->source->type)->toBe(LeadSourceType::ContactForm)
        ->and($lead->name)->toBe('Karim Uddin')
        ->and($lead->message)->toBe("Subject: Website redesign\n\nWe need a new website.")
        ->and($lead->priority->value)->toBe('medium')
        ->and($lead->assigned_to)->toBeNull()
        ->and($lead->source_data)->toBe(['contact_id' => $contact->id]);

    Event::assertDispatched(LeadReceived::class, fn (LeadReceived $event) => $event->leadId === $lead->id);
});

it('creates a new lead each time the same person writes', function () {
    submitContactForm();
    submitContactForm(['message' => 'Following up.']);

    expect(Lead::count())->toBe(2);
});

it('alerts every manager and the mother admin, plus agents opened to contact-form leads', function () {
    Notification::fake();
    $mother = Admin::factory()->create();
    $manager = Admin::factory()->leadManager()->create();
    $openedAgent = Admin::factory()->leadAgent()->create();
    $otherAgent = Admin::factory()->leadAgent()->create();
    $noRole = Admin::factory()->fullAccess()->create();

    DB::table('lead_source_unassigned_viewers')->insert([
        'lead_source_id' => LeadSource::ofType(LeadSourceType::ContactForm)->id,
        'admin_id' => $openedAgent->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    submitContactForm();

    Notification::assertSentTo([$mother, $manager, $openedAgent], NewLeadNotification::class);
    Notification::assertNotSentTo([$otherAgent, $noRole], NewLeadNotification::class);
});

it('still thanks the visitor and keeps the contact if turning it into a lead fails', function () {
    $this->mock(CreateLeadFromContactForm::class)
        ->shouldReceive('handle')
        ->andThrow(new RuntimeException('boom'));

    submitContactForm()->assertSessionHas('success');

    expect(Contact::count())->toBe(1)->and(Lead::count())->toBe(0);
});
