<?php

use App\Leads\Events\AdminNotified;
use App\Leads\Models\AdminNotification;
use App\Models\Admin;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Event;

/**
 * A stand-in lead alert: real alert types arrive with the lead pages.
 */
class FakeLeadAlert extends Notification
{
    public function __construct(private string $url = '/admin/lead-settings/statuses') {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return ['title' => 'New lead', 'message' => 'Jane Doe filled the contact form', 'url' => $this->url];
    }
}

it('stores alerts in the main database and lists only the admin\'s own', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $other = Admin::factory()->leadAgent()->create();

    $agent->notify(new FakeLeadAlert);
    $other->notify(new FakeLeadAlert);

    expect(AdminNotification::query()->count())->toBe(2)
        ->and((new AdminNotification)->getConnectionName())->toBe('pgsql');

    $this->actingAs($agent, 'admin')
        ->getJson(route('admin.leads.notifications.index'))
        ->assertOk()
        ->assertJsonPath('unread_count', 1)
        ->assertJsonCount(1, 'notifications')
        ->assertJsonPath('notifications.0.title', 'New lead')
        ->assertJsonPath('notifications.0.read', false);
});

it('marks an alert read and opens its page in one step', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $agent->notify(new FakeLeadAlert('/admin/lead-settings/currencies'));
    $notification = $agent->notifications()->firstOrFail();

    $this->actingAs($agent, 'admin')
        ->get(route('admin.leads.notifications.open', $notification->id))
        ->assertRedirect('/admin/lead-settings/currencies');

    expect($notification->fresh()->read_at)->not->toBeNull();
});

it('never redirects outside the CMS', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $agent->notify(new FakeLeadAlert('https://evil.example.com'));

    $this->actingAs($agent, 'admin')
        ->get(route('admin.leads.notifications.open', $agent->notifications()->firstOrFail()->id))
        ->assertRedirect(route('admin.dashboard'));
});

it('cannot touch another admin\'s alert', function () {
    $owner = Admin::factory()->leadAgent()->create();
    $owner->notify(new FakeLeadAlert);
    $id = $owner->notifications()->firstOrFail()->id;

    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')
        ->postJson(route('admin.leads.notifications.read', $id))
        ->assertNotFound();

    expect($owner->notifications()->firstOrFail()->read_at)->toBeNull();
});

it('marks all read and clears all', function () {
    $agent = Admin::factory()->leadAgent()->create();
    $agent->notify(new FakeLeadAlert);
    $agent->notify(new FakeLeadAlert);

    $this->actingAs($agent, 'admin')->postJson(route('admin.leads.notifications.read-all'))->assertOk();
    expect($agent->unreadNotifications()->count())->toBe(0);

    $this->actingAs($agent, 'admin')->deleteJson(route('admin.leads.notifications.clear'))->assertOk();
    expect($agent->notifications()->count())->toBe(0);
});

it('pushes a live bell refresh whenever an admin gets an alert', function () {
    Event::fake([AdminNotified::class]);
    $agent = Admin::factory()->leadAgent()->create();

    $agent->notify(new FakeLeadAlert);

    Event::assertDispatched(AdminNotified::class, fn (AdminNotified $event) => $event->admin->is($agent));
});
