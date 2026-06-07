<?php

use App\Models\Admin;
use App\Models\Faq;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

it('lists faqs on the admin index page', function () {
    Faq::factory()->create(['question' => 'How do I start?', 'sort_order' => 1]);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.faqs.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Faq/Index')
            ->where('faqs.data.0.question', 'How do I start?')
        );
});

it('renders the create faq page', function () {
    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.faqs.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Faq/Create'));
});

it('creates a faq and clears the public faq cache', function () {
    Cache::put('faq.items', [['question' => 'Stale']], now()->addMinutes(60));

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.faqs.store'), [
            'question' => 'What services do you offer?',
            'answer' => 'We offer design, marketing, production, and web services.',
            'sort_order' => 2,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.faqs.index'));

    $this->assertDatabaseHas('faqs', [
        'question' => 'What services do you offer?',
        'sort_order' => 2,
        'is_active' => true,
    ]);
    expect(Cache::get('faq.items'))->toBeNull();
});

it('rejects faq creation with missing required fields', function () {
    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.faqs.store'), [])
        ->assertInvalid(['question', 'answer']);
});

it('renders the edit faq page with existing data', function () {
    $faq = Faq::factory()->create(['question' => 'Can this be edited?']);

    $this->actingAs($this->admin, 'admin')
        ->get(route('admin.faqs.edit', $faq))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Faq/Edit')
            ->where('faq.question', 'Can this be edited?')
        );
});

it('updates a faq and clears the public faq cache', function () {
    $faq = Faq::factory()->create(['is_active' => true]);
    Cache::put('faq.items', [['question' => 'Stale']], now()->addMinutes(60));

    $this->actingAs($this->admin, 'admin')
        ->put(route('admin.faqs.update', $faq), [
            'question' => 'Updated question?',
            'answer' => 'Updated answer.',
            'sort_order' => 5,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.faqs.index'));

    $faq->refresh();

    expect($faq->question)->toBe('Updated question?');
    expect($faq->sort_order)->toBe(5);
    expect($faq->is_active)->toBeFalse();
    expect(Cache::get('faq.items'))->toBeNull();
});

it('deletes a faq and clears the public faq cache', function () {
    $faq = Faq::factory()->create();
    Cache::put('faq.items', [['question' => 'Stale']], now()->addMinutes(60));

    $this->actingAs($this->admin, 'admin')
        ->delete(route('admin.faqs.destroy', $faq))
        ->assertRedirect();

    $this->assertDatabaseMissing('faqs', ['id' => $faq->id]);
    expect(Cache::get('faq.items'))->toBeNull();
});

it('only sends active faqs to the public faq page in sort order', function () {
    Faq::factory()->create(['question' => 'Hidden question', 'is_active' => false, 'sort_order' => 0]);
    Faq::factory()->create(['question' => 'Second question', 'is_active' => true, 'sort_order' => 2]);
    Faq::factory()->create(['question' => 'First question', 'is_active' => true, 'sort_order' => 1]);

    $this->get(route('faq'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('FAQ')
            ->where('faqs.0.question', 'First question')
            ->where('faqs.1.question', 'Second question')
            ->where('faqs', fn ($faqs) => collect($faqs)->pluck('question')->doesntContain('Hidden question'))
        );
});
