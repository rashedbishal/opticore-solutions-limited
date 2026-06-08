<?php

use App\Models\JobApplication;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

it('submits a valid career application', function () {
    $this->post(route('careerApply'), [
        'name' => 'Alice Applicant',
        'email' => 'alice@example.com',
        'phone' => '+1 555 123 4567',
        'role' => 'Frontend Developer',
        'portfolio_url' => 'https://alice.example.com',
        'resume' => UploadedFile::fake()->create('resume.pdf', 200, 'application/pdf'),
    ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Your application has been submitted successfully.');

    $application = JobApplication::sole();

    expect($application->name)->toBe('Alice Applicant')
        ->and($application->resume_original_name)->toBe('resume.pdf');

    Storage::disk('local')->assertExists($application->resume_path);
});

it('submits a valid career application without an optional portfolio url', function () {
    $this->post(route('careerApply'), [
        'name' => 'Bob Applicant',
        'email' => 'bob@example.com',
        'phone' => '+1 555 987 6543',
        'role' => 'Backend Developer',
        'resume' => UploadedFile::fake()->create('resume.pdf', 200, 'application/pdf'),
    ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('job_applications', [
        'name' => 'Bob Applicant',
        'portfolio_url' => null,
    ]);
});

it('validates required fields on a career application', function () {
    $this->post(route('careerApply'), [])
        ->assertInvalid(['name', 'email', 'phone', 'role', 'resume']);
});

it('rejects an invalid email format on a career application', function () {
    $this->post(route('careerApply'), [
        'name' => 'Alice Applicant',
        'email' => 'not-an-email',
        'phone' => '+1 555 123 4567',
        'role' => 'Frontend Developer',
        'resume' => UploadedFile::fake()->create('resume.pdf', 200, 'application/pdf'),
    ])->assertInvalid(['email']);
});

it('rejects an invalid portfolio url on a career application', function () {
    $this->post(route('careerApply'), [
        'name' => 'Alice Applicant',
        'email' => 'alice@example.com',
        'phone' => '+1 555 123 4567',
        'role' => 'Frontend Developer',
        'portfolio_url' => 'not-a-url',
        'resume' => UploadedFile::fake()->create('resume.pdf', 200, 'application/pdf'),
    ])->assertInvalid(['portfolio_url']);
});

it('rejects a non-pdf resume on a career application', function () {
    $this->post(route('careerApply'), [
        'name' => 'Alice Applicant',
        'email' => 'alice@example.com',
        'phone' => '+1 555 123 4567',
        'role' => 'Frontend Developer',
        'resume' => UploadedFile::fake()->image('resume.jpg'),
    ])->assertInvalid(['resume']);
});

it('rejects a resume exceeding the maximum file size', function () {
    $this->post(route('careerApply'), [
        'name' => 'Alice Applicant',
        'email' => 'alice@example.com',
        'phone' => '+1 555 123 4567',
        'role' => 'Frontend Developer',
        'resume' => UploadedFile::fake()->create('resume.pdf', 5121, 'application/pdf'),
    ])->assertInvalid(['resume']);
});

it('throttles repeated career application submissions', function () {
    $payload = [
        'name' => 'Throttle Tester',
        'email' => 'throttle@example.com',
        'phone' => '+1 555 000 0000',
        'role' => 'QA Engineer',
    ];

    for ($i = 0; $i < 3; $i++) {
        $this->post(route('careerApply'), [
            ...$payload,
            'resume' => UploadedFile::fake()->create('resume.pdf', 200, 'application/pdf'),
        ])->assertRedirect();
    }

    $this->post(route('careerApply'), [
        ...$payload,
        'resume' => UploadedFile::fake()->create('resume.pdf', 200, 'application/pdf'),
    ])->assertStatus(429);
});
