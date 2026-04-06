<?php

namespace App\Http\Controllers;

use App\Http\Requests\AppointmentRequest;
use Illuminate\Http\RedirectResponse;

class AppointmentController extends Controller
{
    public function store(AppointmentRequest $request): RedirectResponse
    {
        $request->validated();

        return back()->with('success', 'Your appointment request has been received.');
    }
}
