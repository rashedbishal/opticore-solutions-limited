<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactRequest;
use Illuminate\Http\RedirectResponse;

class ContactController extends Controller
{
    public function store(ContactRequest $request): RedirectResponse
    {
        $request->validated();

        return back()->with('success', 'Thanks for reaching out. We will be in touch soon.');
    }
}
