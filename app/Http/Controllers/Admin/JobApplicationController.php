<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class JobApplicationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/JobApplication/Index', [
            'jobApplications' => JobApplication::latest()->paginate(10),
        ]);
    }

    public function downloadResume(JobApplication $jobApplication): StreamedResponse
    {
        abort_unless(Storage::disk('local')->exists($jobApplication->resume_path), 404);

        return Storage::disk('local')->download(
            $jobApplication->resume_path,
            $jobApplication->resume_original_name,
        );
    }

    public function destroy(JobApplication $jobApplication): RedirectResponse
    {
        Storage::disk('local')->delete($jobApplication->resume_path);

        $jobApplication->delete();

        return back()->with('success', 'Job application deleted.');
    }
}
