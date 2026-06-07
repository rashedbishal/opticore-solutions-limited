<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreJobListingRequest;
use App\Http\Requests\UpdateJobListingRequest;
use App\Models\JobListing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class JobListingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/JobListing/Index', [
            'jobListings' => JobListing::query()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->paginate(10)
                ->through(fn (JobListing $jobListing) => [
                    'id' => $jobListing->id,
                    'title' => $jobListing->title,
                    'location' => $jobListing->location,
                    'type' => $jobListing->type,
                    'description' => $jobListing->description,
                    'sort_order' => $jobListing->sort_order,
                    'is_active' => $jobListing->is_active,
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/JobListing/Create');
    }

    public function store(StoreJobListingRequest $request): RedirectResponse
    {
        JobListing::create($request->validated());
        Cache::forget('career.jobListings');

        return redirect()->route('admin.job-listings.index')->with('success', 'Job listing created.');
    }

    public function show(JobListing $jobListing): RedirectResponse
    {
        return redirect()->route('admin.job-listings.edit', $jobListing);
    }

    public function edit(JobListing $jobListing): Response
    {
        return Inertia::render('Admin/JobListing/Edit', [
            'jobListing' => [
                'id' => $jobListing->id,
                'title' => $jobListing->title,
                'location' => $jobListing->location,
                'type' => $jobListing->type,
                'description' => $jobListing->description,
                'sort_order' => $jobListing->sort_order,
                'is_active' => $jobListing->is_active,
            ],
        ]);
    }

    public function update(UpdateJobListingRequest $request, JobListing $jobListing): RedirectResponse
    {
        $jobListing->update($request->validated());
        Cache::forget('career.jobListings');

        return redirect()->route('admin.job-listings.index')->with('success', 'Job listing updated.');
    }

    public function destroy(JobListing $jobListing): RedirectResponse
    {
        $jobListing->delete();
        Cache::forget('career.jobListings');

        return back()->with('success', 'Job listing deleted.');
    }
}
