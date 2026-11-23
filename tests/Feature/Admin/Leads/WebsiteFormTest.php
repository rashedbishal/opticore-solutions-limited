<?php

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Leads\Models\WebsiteForm;
use App\Leads\Notifications\NewLeadNotification;
use App\Models\Admin;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

/**
 * Creates a form through the mother admin's page and returns its key.
 */
function createWebsiteForm(array $overrides = []): array
{
    $mother = Admin::factory()->create();

    test()->actingAs($mother, 'admin')->post(route('admin.lead-settings.website-forms.store'), [
        'name' => 'Winter Offer',
        'is_active' => true,
        'fields' => ['email', 'phone', 'message'],
        'allowed_domains' => [],
        ...$overrides,
    ])->assertSessionHasNoErrors();

    $revealed = session('website_form_revealed');
    test()->flushSession();
    Auth::guard('admin')->logout();

    return [WebsiteForm::findOrFail($revealed['form_id']), $revealed['token']];
}

it('only lets the mother admin manage website forms', function () {
    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->get(route('admin.lead-settings.website-forms.index'))
        ->assertForbidden();
});

it('creates a lead from a submission and alerts the managers', function () {
    Notification::fake();
    $manager = Admin::factory()->leadManager()->create();
    [$form, $token] = createWebsiteForm();

    $this->postJson("/api/forms/{$token}", ['name' => 'Sadia Rahman', 'email' => 'sadia@example.com', 'phone' => '01711000000', 'message' => 'Interested'], ['Origin' => 'https://anysite.test'])
        ->assertOk()
        ->assertJson(['status' => 'ok'])
        ->assertHeader('Access-Control-Allow-Origin');

    $lead = Lead::sole();

    expect($lead->source->type)->toBe(LeadSourceType::WebsiteForm)
        ->and($lead->name)->toBe('Sadia Rahman')
        ->and($lead->source_data['website_form_name'])->toBe('Winter Offer');

    Notification::assertSentTo($manager, NewLeadNotification::class);
});

it('silently drops spam bots that fill the hidden field', function () {
    [, $token] = createWebsiteForm();

    $this->postJson("/api/forms/{$token}", ['name' => 'Bot', '_gotcha' => 'gotcha'])->assertOk();

    expect(Lead::count())->toBe(0);
});

it('creates only one lead for a double-clicked submit', function () {
    [, $token] = createWebsiteForm();
    $payload = ['name' => 'Double Click', 'email' => 'dc@example.com'];

    $this->postJson("/api/forms/{$token}", $payload)->assertOk();
    $this->postJson("/api/forms/{$token}", $payload)->assertOk();

    expect(Lead::count())->toBe(1);
});

it('rejects submissions from websites that are not allowed', function () {
    [$form, $token] = createWebsiteForm(['allowed_domains' => ['https://opticoresolutionsltd.com/']]);

    $this->postJson("/api/forms/{$token}", ['name' => 'Spam Person'], ['Origin' => 'https://spammy-site.com'])->assertForbidden();
    $this->postJson("/api/forms/{$token}", ['name' => 'No Origin'])->assertForbidden();
    $this->postJson("/api/forms/{$token}", ['name' => 'Real Person'], ['Origin' => 'https://offer.opticoresolutionsltd.com'])->assertOk();

    expect(Lead::sole()->name)->toBe('Real Person')
        ->and($form->fresh()->allowed_domains)->toBe(['opticoresolutionsltd.com'])
        ->and($form->leadSource->fresh()->last_signature_rejection_at)->not->toBeNull();
});

it('validates the fields and refuses off or unknown forms', function () {
    [$form, $token] = createWebsiteForm();

    $this->postJson("/api/forms/{$token}", ['email' => 'not-an-email'])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email']);
    $this->postJson('/api/forms/'.str_repeat('a', 40), ['name' => 'X Person'])->assertNotFound();

    $form->update(['is_active' => false]);
    $this->postJson("/api/forms/{$token}", ['name' => 'X Person'])->assertNotFound();
});

it('stops the old key working after a new key is made', function () {
    [$form, $oldToken] = createWebsiteForm();

    $this->actingAs(Admin::factory()->create(), 'admin')->post(route('admin.lead-settings.website-forms.regenerate', $form));
    $newToken = session('website_form_revealed')['token'];
    $this->flushSession();

    $this->postJson("/api/forms/{$oldToken}", ['name' => 'Old Key'])->assertNotFound();
    $this->postJson("/api/forms/{$newToken}", ['name' => 'New Key'])->assertOk();
});

it('shows a thank-you page to a normal browser form post', function () {
    [, $token] = createWebsiteForm();

    $this->post("/api/forms/{$token}", ['name' => 'Plain Html'])
        ->assertOk()
        ->assertSee('Thank you!');

    expect(LeadSource::where('type', 'website_form')->count())->toBe(1);
});
