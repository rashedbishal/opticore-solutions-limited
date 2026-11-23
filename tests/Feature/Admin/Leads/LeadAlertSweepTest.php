<?php

use App\Leads\Models\Lead;
use App\Leads\Models\LeadSetting;
use App\Leads\Notifications\FollowUpAlertNotification;
use App\Leads\Notifications\MeetingAlertNotification;
use App\Leads\Support\LeadClock;
use App\Models\Admin;
use Illuminate\Support\Facades\Date;

it('does nothing while reminders are off', function () {
    Admin::factory()->leadManager()->create();
    Lead::factory()->create(['meeting_date' => LeadClock::todayString()]);

    $this->artisan('leads:send-alert-notifications')->assertSuccessful();

    expect(Admin::query()->get()->sum(fn (Admin $a) => $a->notifications()->count()))->toBe(0);
});

it('alerts managers and the owner once a day while a reminder is showing', function () {
    LeadSetting::current()->update(['meeting_alert_enabled' => true, 'meeting_alert_days_before' => 1]);
    $manager = Admin::factory()->leadManager()->create();
    $owner = Admin::factory()->leadAgent()->create();
    $otherAgent = Admin::factory()->leadAgent()->create();
    Lead::factory()->assignedTo($owner)->create(['meeting_date' => LeadClock::today()->addDay()->toDateString()]);
    Lead::factory()->create(['meeting_date' => LeadClock::today()->addDays(5)->toDateString()]); // not yet

    $this->artisan('leads:send-alert-notifications');
    $this->artisan('leads:send-alert-notifications');

    expect($manager->notifications()->where('type', MeetingAlertNotification::class)->count())->toBe(1)
        ->and($owner->notifications()->where('type', MeetingAlertNotification::class)->count())->toBe(1)
        ->and($otherAgent->notifications()->count())->toBe(0);
});

it('uses the Bangladesh calendar for "today"', function () {
    LeadSetting::current()->update(['followup_alert_enabled' => true, 'followup_alert_days_before' => 0]);
    $manager = Admin::factory()->leadManager()->create();

    // 20:00 UTC on the 1st is already 02:00 on the 2nd in Dhaka.
    Date::setTestNow('2026-12-01 20:00:00');
    Lead::factory()->create(['next_follow_up_at' => '2026-12-02']);

    $this->artisan('leads:send-alert-notifications');

    expect($manager->notifications()->where('type', FollowUpAlertNotification::class)->count())->toBe(1);
});
