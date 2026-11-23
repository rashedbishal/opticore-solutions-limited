<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactRequest;
use App\Jobs\ProcessContactMessage;
use App\Leads\Actions\CreateLeadFromContactForm;
use App\Models\Contact;
use Illuminate\Http\RedirectResponse;

class ContactController extends Controller
{
    public function store(ContactRequest $request, CreateLeadFromContactForm $createLead): RedirectResponse
    {
        $contact = Contact::create($request->validated());

        ProcessContactMessage::dispatch($contact);

        // The message is already safely saved in Contacts; a problem turning
        // it into a lead is reported, never shown to the visitor.
        try {
            $createLead->handle($contact);
        } catch (\Throwable $exception) {
            report($exception);
        }

        return back()->with('success', 'Thanks for reaching out. We will be in touch soon.');
    }
}
