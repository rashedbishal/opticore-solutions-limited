<?php

it('submits a valid career application', function () {
    $this->post(route('careerApply'), [
        'name' => 'Alice Applicant',
        'email' => 'alice@example.com',
        'phone' => '+1 555 123 4567',
        'role' => 'Frontend Developer',
        'portfolio_url' => 'https://alice.example.com',
        'message' => 'I would love to join the team and contribute to your projects.',
    ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Your application has been submitted successfully.');
});

it('submits a valid career application without an optional portfolio url', function () {
    $this->post(route('careerApply'), [
        'name' => 'Bob Applicant',
        'email' => 'bob@example.com',
        'phone' => '+1 555 987 6543',
        'role' => 'Backend Developer',
        'message' => 'Excited about the opportunity to apply my skills here.',
    ])
        ->assertRedirect()
        ->assertSessionHas('success');
});

it('validates required fields on a career application', function () {
    $this->post(route('careerApply'), [])
        ->assertInvalid(['name', 'email', 'phone', 'role', 'message']);
});

it('rejects an invalid email format on a career application', function () {
    $this->post(route('careerApply'), [
        'name' => 'Alice Applicant',
        'email' => 'not-an-email',
        'phone' => '+1 555 123 4567',
        'role' => 'Frontend Developer',
        'message' => 'A valid message body for the application.',
    ])->assertInvalid(['email']);
});

it('rejects an invalid portfolio url on a career application', function () {
    $this->post(route('careerApply'), [
        'name' => 'Alice Applicant',
        'email' => 'alice@example.com',
        'phone' => '+1 555 123 4567',
        'role' => 'Frontend Developer',
        'portfolio_url' => 'not-a-url',
        'message' => 'A valid message body for the application.',
    ])->assertInvalid(['portfolio_url']);
});

it('rejects a career application message exceeding the maximum length', function () {
    $this->post(route('careerApply'), [
        'name' => 'Alice Applicant',
        'email' => 'alice@example.com',
        'phone' => '+1 555 123 4567',
        'role' => 'Frontend Developer',
        'message' => str_repeat('a', 5001),
    ])->assertInvalid(['message']);
});

it('throttles repeated career application submissions', function () {
    $payload = [
        'name' => 'Throttle Tester',
        'email' => 'throttle@example.com',
        'phone' => '+1 555 000 0000',
        'role' => 'QA Engineer',
        'message' => 'Submitting multiple times to trigger the throttle limit.',
    ];

    for ($i = 0; $i < 3; $i++) {
        $this->post(route('careerApply'), $payload)->assertRedirect();
    }

    $this->post(route('careerApply'), $payload)->assertStatus(429);
});
