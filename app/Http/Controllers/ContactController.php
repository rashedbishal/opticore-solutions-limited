<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactRequest;
use App\Jobs\ProcessContactMessage;
use App\Models\Contact;
use Illuminate\Http\RedirectResponse;

class ContactController extends Controller
{
    public function store(ContactRequest $request): RedirectResponse
    {
        $contact = Contact::create($request->validated());

        ProcessContactMessage::dispatch($contact);

        return back()->with('success', 'Thanks for reaching out. We will be in touch soon.');
    }
}
