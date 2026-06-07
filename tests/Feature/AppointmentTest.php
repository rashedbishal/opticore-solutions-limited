<?php

it('submits a valid appointment request', function () {
    $this->post(route('appointmentStore'), [
        'name' => 'Alice Client',
        'email' => 'alice@example.com',
        'phone' => '+1 555 123 4567',
        'service' => 'Web Development',
        'preferred_date' => now()->addWeek()->format('Y-m-d'),
        'message' => 'Looking forward to discussing my project.',
    ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Your appointment request has been received.');
});

it('submits a valid appointment request without an optional message', function () {
    $this->post(route('appointmentStore'), [
        'name' => 'Bob Client',
        'email' => 'bob@example.com',
        'phone' => '+1 555 987 6543',
        'service' => 'Graphic Design',
        'preferred_date' => now()->addWeek()->format('Y-m-d'),
    ])
        ->assertRedirect()
        ->assertSessionHas('success');
});

it('validates required fields on an appointment request', function () {
    $this->post(route('appointmentStore'), [])
        ->assertInvalid(['name', 'email', 'phone', 'service', 'preferred_date']);
});

it('rejects an invalid email format on an appointment request', function () {
    $this->post(route('appointmentStore'), [
        'name' => 'Alice Client',
        'email' => 'not-an-email',
        'phone' => '+1 555 123 4567',
        'service' => 'Web Development',
        'preferred_date' => now()->addWeek()->format('Y-m-d'),
    ])->assertInvalid(['email']);
});

it('rejects an invalid preferred date on an appointment request', function () {
    $this->post(route('appointmentStore'), [
        'name' => 'Alice Client',
        'email' => 'alice@example.com',
        'phone' => '+1 555 123 4567',
        'service' => 'Web Development',
        'preferred_date' => 'not-a-date',
    ])->assertInvalid(['preferred_date']);
});

it('rejects an appointment message exceeding the maximum length', function () {
    $this->post(route('appointmentStore'), [
        'name' => 'Alice Client',
        'email' => 'alice@example.com',
        'phone' => '+1 555 123 4567',
        'service' => 'Web Development',
        'preferred_date' => now()->addWeek()->format('Y-m-d'),
        'message' => str_repeat('a', 5001),
    ])->assertInvalid(['message']);
});

it('throttles repeated appointment request submissions', function () {
    $payload = [
        'name' => 'Throttle Tester',
        'email' => 'throttle@example.com',
        'phone' => '+1 555 000 0000',
        'service' => 'Digital Marketing',
        'preferred_date' => now()->addWeek()->format('Y-m-d'),
    ];

    for ($i = 0; $i < 5; $i++) {
        $this->post(route('appointmentStore'), $payload)->assertRedirect();
    }

    $this->post(route('appointmentStore'), $payload)->assertStatus(429);
});
