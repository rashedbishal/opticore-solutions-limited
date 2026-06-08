<?php

namespace App\Http\Controllers;

use App\Http\Requests\CareerApplicationRequest;
use App\Models\JobApplication;
use Illuminate\Http\RedirectResponse;

class CareerController extends Controller
{
    public function apply(CareerApplicationRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $resume = $request->file('resume');
        $resumePath = $resume->store('resumes', 'local');

        JobApplication::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'role' => $validated['role'],
            'portfolio_url' => $validated['portfolio_url'] ?? null,
            'resume_path' => $resumePath,
            'resume_original_name' => $resume->getClientOriginalName(),
        ]);

        return back()->with('success', 'Your application has been submitted successfully.');
    }
}
