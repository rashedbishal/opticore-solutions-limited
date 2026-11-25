<?php

use App\Models\Admin;
use App\Support\ApplicationLog;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->logPath = tempnam(sys_get_temp_dir(), 'app-log-test-');
    $this->app->bind(ApplicationLog::class, fn () => new ApplicationLog($this->logPath));
});

afterEach(function () {
    @unlink($this->logPath);
});

function sampleLog(): string
{
    return "[2026-11-20 10:00:00] production.INFO: First thing happened\n"
        ."[2026-11-21 11:00:00] production.ERROR: Something broke {\"exception\":\"[object] (RuntimeException(code: 0): Something broke at /app/x.php:10)\n"
        ."[stacktrace]\n"
        ."#0 /app/y.php(20): foo()\n"
        ."#1 {main}\n"
        ."\"}\n"
        ."[2026-11-22 12:00:00] production.WARNING: Careful now\n";
}

/** @return array<int, array<string, mixed>> */
function logEntries(Admin $mother, string $query = ''): array
{
    $entries = [];
    test()->actingAs($mother, 'admin')
        ->get(route('admin.application-log.index').$query)
        ->assertOk()
        ->assertInertia(function (Assert $page) use (&$entries) {
            $page->component('Admin/ApplicationLog/Index');
            $entries = $page->toArray()['props']['entries'];
        });

    return $entries;
}

it('is hidden from every admin except the mother admin', function (string $state) {
    $this->actingAs(Admin::factory()->{$state}()->create(), 'admin')
        ->get(route('admin.application-log.index'))->assertForbidden();
    $this->delete(route('admin.application-log.clear'))->assertForbidden();
})->with(['fullAccess', 'leadManager']);

it('lists entries newest first with their stack traces attached', function () {
    file_put_contents($this->logPath, sampleLog());

    $entries = logEntries(Admin::factory()->create());

    expect($entries)->toHaveCount(3)
        ->and(array_column($entries, 'level'))->toBe(['warning', 'error', 'info'])
        ->and($entries[1]['message'])->toStartWith('Something broke')
        ->and($entries[1]['details'])->toContain('#1 {main}')
        ->and($entries[1]['datetime'])->toBe('2026-11-21 11:00:00');
});

it('filters by level', function () {
    file_put_contents($this->logPath, sampleLog());

    expect(array_column(logEntries(Admin::factory()->create(), '?level=error'), 'level'))->toBe(['error']);
});

it('removes one entry and keeps the rest and the file', function () {
    file_put_contents($this->logPath, sampleLog());
    $mother = Admin::factory()->create();
    $error = logEntries($mother)[1];

    $this->delete(route('admin.application-log.destroy'), ['ids' => [$error['id']]])
        ->assertSessionHas('success');

    expect(file_exists($this->logPath))->toBeTrue()
        ->and(file_get_contents($this->logPath))->toBe(
            "[2026-11-20 10:00:00] production.INFO: First thing happened\n"
            ."[2026-11-22 12:00:00] production.WARNING: Careful now\n",
        );
});

it('removes several selected entries at once', function () {
    file_put_contents($this->logPath, sampleLog());
    $mother = Admin::factory()->create();
    $entries = logEntries($mother);

    $this->delete(route('admin.application-log.destroy'), ['ids' => [$entries[0]['id'], $entries[2]['id']]])
        ->assertSessionHas('success', '2 log entries removed.');

    expect(array_column(logEntries($mother), 'level'))->toBe(['error']);
});

it('keeps lines written after the page loaded', function () {
    file_put_contents($this->logPath, sampleLog());
    $mother = Admin::factory()->create();
    $first = logEntries($mother)[2];
    file_put_contents($this->logPath, "[2026-11-23 09:00:00] production.INFO: Newer line\n", FILE_APPEND);

    $this->delete(route('admin.application-log.destroy'), ['ids' => [$first['id']]])->assertSessionHas('success');

    expect(file_get_contents($this->logPath))->toEndWith("Newer line\n")
        ->not->toContain('First thing happened');
});

it('never removes an entry whose text changed since the page loaded', function () {
    file_put_contents($this->logPath, sampleLog());
    $mother = Admin::factory()->create();
    $first = logEntries($mother)[2];
    file_put_contents($this->logPath, str_replace('First thing', 'Other thing', sampleLog()));

    $this->delete(route('admin.application-log.destroy'), ['ids' => [$first['id']]])->assertSessionHas('error');

    expect(file_get_contents($this->logPath))->toContain('Other thing happened');
});

it('empties the file without deleting it', function () {
    file_put_contents($this->logPath, sampleLog());
    $inode = fileinode($this->logPath);

    $this->actingAs(Admin::factory()->create(), 'admin')
        ->delete(route('admin.application-log.clear'))
        ->assertRedirect(route('admin.application-log.index'));

    clearstatcache();
    expect(file_exists($this->logPath))->toBeTrue()
        ->and(filesize($this->logPath))->toBe(0)
        ->and(fileinode($this->logPath))->toBe($inode);
});

it('shows an empty page when there is no log file', function () {
    unlink($this->logPath);

    expect(logEntries(Admin::factory()->create()))->toBe([]);
});
