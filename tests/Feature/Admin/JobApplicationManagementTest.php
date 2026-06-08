<?php

use App\Models\Admin;
use App\Models\JobApplication;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
    Storage::fake('local');
});

it('renders the job applications index page with paginated applications', function () {
    JobApplication::factory()->count(3)->create();

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.job-applications.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/JobApplication/Index')
            ->has('jobApplications')
        );
});

it('lets an admin download an applicant resume', function () {
    $resume = UploadedFile::fake()->create('resume.pdf', 200, 'application/pdf');
    $path = $resume->store('resumes', 'local');

    $application = JobApplication::factory()->create([
        'resume_path' => $path,
        'resume_original_name' => 'resume.pdf',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.job-applications.resume', $application))
        ->assertSuccessful()
        ->assertHeader('content-disposition', 'attachment; filename=resume.pdf');
});

it('returns 404 when downloading a resume that no longer exists on disk', function () {
    $application = JobApplication::factory()->create([
        'resume_path' => 'resumes/missing.pdf',
    ]);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.job-applications.resume', $application))
        ->assertNotFound();
});

it('deletes a job application and its resume file from storage', function () {
    $resume = UploadedFile::fake()->create('resume.pdf', 200, 'application/pdf');
    $path = $resume->store('resumes', 'local');

    $application = JobApplication::factory()->create([
        'resume_path' => $path,
    ]);

    Storage::disk('local')->assertExists($path);

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.job-applications.destroy', $application))
        ->assertRedirect();

    $this->assertDatabaseMissing('job_applications', ['id' => $application->id]);
    Storage::disk('local')->assertMissing($path);
});

it('returns 404 when deleting a non-existent job application', function () {
    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.job-applications.destroy', 999999))
        ->assertNotFound();
});

it('prevents guests from accessing job application admin routes', function () {
    $application = JobApplication::factory()->create();

    $this->get(route('admin.job-applications.index'))->assertRedirect(route('admin.login'));
    $this->get(route('admin.job-applications.resume', $application))->assertRedirect(route('admin.login'));
    $this->delete(route('admin.job-applications.destroy', $application))->assertRedirect(route('admin.login'));
});
