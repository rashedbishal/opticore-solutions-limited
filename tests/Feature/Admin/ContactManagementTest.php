<?php

use App\Models\Admin;
use App\Models\Contact;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

it('renders the contacts index page with paginated contacts', function () {
    Contact::factory()->count(3)->create();

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.contacts.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Contact/Index')
            ->has('contacts')
        );
});

it('deletes a contact submission', function () {
    $contact = Contact::factory()->create();

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.contacts.destroy', $contact))
        ->assertRedirect();

    $this->assertDatabaseMissing('contacts', ['id' => $contact->id]);
});

it('returns 404 when deleting a non-existent contact', function () {
    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.contacts.destroy', 999999))
        ->assertNotFound();
});
