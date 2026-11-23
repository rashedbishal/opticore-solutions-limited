<?php

use App\Leads\Actions\RecordLeadConsent;
use App\Leads\Enums\ConsentSource;
use App\Leads\Enums\ConsentStatus;
use App\Leads\Enums\ConsentType;
use App\Leads\Enums\LeadDuplicateLinkStatus;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadDuplicateLink;
use App\Leads\Models\LeadNote;
use App\Leads\Models\LeadTag;
use App\Leads\Services\LeadDuplicateDetector;
use App\Models\Admin;
use Inertia\Testing\AssertableInertia as Assert;

it('flags leads with the same phone or email when one is opened', function () {
    $manager = Admin::factory()->leadManager()->create();
    $a = Lead::factory()->create(['phone' => '+880 1711-000000', 'email' => null]);
    $b = Lead::factory()->create(['phone' => '8801711000000', 'email' => 'x@example.com']);

    $this->actingAs($manager, 'admin')->get(route('admin.leads.show', $a))
        ->assertInertia(fn (Assert $page) => $page
            ->where('lead.duplicates.0.other.id', $b->id)
            ->where('lead.duplicates.0.matched_fields', ['phone'])
            ->where('lead.duplicates.0.can_merge', true));

    expect(LeadDuplicateLink::sole()->status)->toBe(LeadDuplicateLinkStatus::Pending);
});

it('lets only managers merge, moving everything and hiding the other lead', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $manager = Admin::factory()->leadManager()->create();
    $keep = Lead::factory()->assignedTo($agent)->create(['email' => 'same@example.com', 'company' => 'Old Co']);
    $gone = Lead::factory()->create(['email' => 'SAME@example.com', 'company' => 'New Co', 'website' => 'https://new.example']);
    LeadNote::create(['lead_id' => $gone->id, 'note' => 'From the other lead', 'admin_id' => $manager->id, 'admin_name' => $manager->name]);
    $tag = LeadTag::create(['name' => 'VIP', 'slug' => 'vip', 'color' => 'amber']);
    $gone->tags()->attach($tag->id);
    app(RecordLeadConsent::class)->handle($gone, ConsentType::Marketing, ConsentStatus::Withdrawn, ConsentSource::Manual);

    $link = app(LeadDuplicateDetector::class)->detectFor($keep)->sole();

    $this->actingAs($agent, 'admin')->post(route('admin.leads.duplicates.merge', [$keep, $link]), ['keep' => 'this'])->assertForbidden();

    $this->flushSession();
    $this->actingAs($manager, 'admin')
        ->post(route('admin.leads.duplicates.merge', [$keep, $link]), ['keep' => 'this', 'choices' => ['company' => 'loser']])
        ->assertRedirect(route('admin.leads.show', $keep));

    $keep->refresh();

    expect($keep->company)->toBe('New Co')
        ->and($keep->website)->toBe('https://new.example')
        ->and($keep->notes()->count())->toBe(1)
        ->and($keep->tags()->pluck('name')->all())->toBe(['VIP'])
        ->and($keep->consents()->sole()->status)->toBe(ConsentStatus::Withdrawn)
        ->and(Lead::find($gone->id))->toBeNull()
        ->and(Lead::query()->withMerged()->find($gone->id)->merged_into_lead_id)->toBe($keep->id)
        ->and($link->fresh()->status)->toBe(LeadDuplicateLinkStatus::Merged);

    $this->actingAs($manager, 'admin')->get(route('admin.leads.show', $gone->id))->assertRedirect(route('admin.leads.show', $keep));
});

it('can be dismissed as not a duplicate', function () {
    $manager = Admin::factory()->leadManager()->create();
    $a = Lead::factory()->create(['email' => 'one@example.com']);
    Lead::factory()->create(['email' => 'one@example.com']);
    $link = app(LeadDuplicateDetector::class)->detectFor($a)->sole();

    $this->actingAs($manager, 'admin')->post(route('admin.leads.duplicates.dismiss', [$a, $link]))->assertSessionHas('success');

    expect($link->fresh()->status)->toBe(LeadDuplicateLinkStatus::Dismissed);
    $this->actingAs($manager, 'admin')->get(route('admin.leads.show', $a))
        ->assertInertia(fn (Assert $page) => $page->where('lead.duplicates', []));
});

it('finds duplicate pairs overnight', function () {
    Lead::factory()->create(['phone' => '01711000000']);
    Lead::factory()->create(['phone' => '017-1100-0000']);

    $this->artisan('leads:detect-duplicates')->assertSuccessful();

    expect(LeadDuplicateLink::count())->toBe(1);
});
