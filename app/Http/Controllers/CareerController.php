<?php

namespace App\Http\Controllers;

use App\Http\Requests\CareerApplicationRequest;
use Illuminate\Http\RedirectResponse;

class CareerController extends Controller
{
    public function apply(CareerApplicationRequest $request): RedirectResponse
    {
        $request->validated();

        return back()->with('success', 'Your application has been submitted successfully.');
    }
}
