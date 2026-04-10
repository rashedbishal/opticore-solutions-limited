<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ContactController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Contact/Index', [
            'contacts' => Contact::latest()->paginate(20)
        ]);
    }

    public function destroy(Contact $contact): RedirectResponse
    {
        $contact->delete();
        return back()->with('success', 'Contact feedback deleted.');
    }
}
