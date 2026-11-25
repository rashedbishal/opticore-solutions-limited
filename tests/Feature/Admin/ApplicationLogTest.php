<?php

use App\Models\Admin;
use App\Support\ApplicationLogFiles;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->travelTo('2026-11-25 10:00:00');
    $this->logDir = sys_get_temp_dir().'/app-log-test-'.uniqid();
    mkdir($this->logDir);
    $this->app->bind(ApplicationLogFiles::class, fn () => new ApplicationLogFiles($this->logDir));
});

afterEach(function () {
    File::deleteDirectory($this->logDir);
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

function writeLog(string $name, string $contents, int $modifiedDaysAgo = 0): string
{
    $path = test()->logDir.'/'.$name;
    file_put_contents($path, $contents);
    touch($path, now()->subDays($modifiedDaysAgo)->getTimestamp());

    return $path;
}

/** @return array<string, mixed> */
function logPage(Admin $mother, array $query = []): array
{
    $props = [];
    test()->actingAs($mother, 'admin')
        ->get(route('admin.application-log.index', $query))
        ->assertOk()
        ->assertInertia(function (Assert $page) use (&$props) {
            $page->component('Admin/ApplicationLog/Index');
            $props = $page->toArray()['props'];
        });

    return $props;
}

it('is hidden from every admin except the mother admin', function (string $state) {
    writeLog('laravel-2026-11-20.log', sampleLog(), 5);
    $this->actingAs(Admin::factory()->{$state}()->create(), 'admin')
        ->get(route('admin.application-log.index'))->assertForbidden();
    $this->delete(route('admin.application-log.clear'), ['file' => 'laravel-2026-11-20.log'])->assertForbidden();
    $this->delete(route('admin.application-log.files.destroy'), ['file' => 'laravel-2026-11-20.log', 'password' => 'password', 'password_again' => 'password'])->assertForbidden();

    expect(file_exists($this->logDir.'/laravel-2026-11-20.log'))->toBeTrue();
})->with(['fullAccess', 'leadManager']);

it('lists laravel.log and the dated files, newest first, and nothing else', function () {
    writeLog('laravel-2026-11-23.log', 'x', 2);
    writeLog('laravel-2026-11-25.log', 'x', 0);
    writeLog('laravel.log', 'x', 10);
    writeLog('browser.log', 'x');
    writeLog('laravel-backup.log', 'x');

    $files = logPage(Admin::factory()->create())['files'];

    expect(array_column($files, 'name'))->toBe(['laravel-2026-11-25.log', 'laravel-2026-11-23.log', 'laravel.log'])
        ->and(array_column($files, 'is_today'))->toBe([true, false, false])
        ->and(array_column($files, 'can_delete'))->toBe([false, true, false]);
});

it('opens the newest file by default and another file when picked', function () {
    writeLog('laravel-2026-11-24.log', sampleLog(), 1);
    writeLog('laravel-2026-11-25.log', "[2026-11-25 09:00:00] production.INFO: Today only\n");
    $mother = Admin::factory()->create();

    expect(logPage($mother)['file']['name'])->toBe('laravel-2026-11-25.log')
        ->and(logPage($mother)['entries'][0]['message'])->toBe('Today only');

    $props = logPage($mother, ['file' => 'laravel-2026-11-24.log']);
    expect($props['file']['name'])->toBe('laravel-2026-11-24.log')
        ->and(array_column($props['entries'], 'level'))->toBe(['warning', 'error', 'info'])
        ->and($props['entries'][1]['details'])->toContain('#1 {main}');
});

it('never opens a file outside the list', function () {
    writeLog('laravel.log', sampleLog());

    expect(logPage(Admin::factory()->create(), ['file' => '../../.env'])['file']['name'])->toBe('laravel.log');

    $this->delete(route('admin.application-log.clear'), ['file' => '../../.env'])->assertNotFound();
});

it('filters by level', function () {
    writeLog('laravel.log', sampleLog());

    expect(array_column(logPage(Admin::factory()->create(), ['level' => 'error'])['entries'], 'level'))->toBe(['error']);
});

it('removes one entry from the chosen file and keeps the rest and the file', function () {
    $path = writeLog('laravel-2026-11-24.log', sampleLog(), 1);
    $mother = Admin::factory()->create();
    $error = logPage($mother, ['file' => 'laravel-2026-11-24.log'])['entries'][1];

    $this->delete(route('admin.application-log.destroy'), ['file' => 'laravel-2026-11-24.log', 'ids' => [$error['id']]])
        ->assertSessionHas('success');

    expect(file_get_contents($path))->toBe(
        "[2026-11-20 10:00:00] production.INFO: First thing happened\n"
        ."[2026-11-22 12:00:00] production.WARNING: Careful now\n",
    );
});

it('removes several selected entries at once', function () {
    writeLog('laravel.log', sampleLog());
    $mother = Admin::factory()->create();
    $entries = logPage($mother)['entries'];

    $this->delete(route('admin.application-log.destroy'), ['file' => 'laravel.log', 'ids' => [$entries[0]['id'], $entries[2]['id']]])
        ->assertSessionHas('success', '2 log entries removed.');

    expect(array_column(logPage($mother)['entries'], 'level'))->toBe(['error']);
});

it('keeps lines written after the page loaded', function () {
    $path = writeLog('laravel.log', sampleLog());
    $mother = Admin::factory()->create();
    $first = logPage($mother)['entries'][2];
    file_put_contents($path, "[2026-11-23 09:00:00] production.INFO: Newer line\n", FILE_APPEND);

    $this->delete(route('admin.application-log.destroy'), ['file' => 'laravel.log', 'ids' => [$first['id']]])->assertSessionHas('success');

    expect(file_get_contents($path))->toEndWith("Newer line\n")->not->toContain('First thing happened');
});

it('never removes an entry whose text changed since the page loaded', function () {
    $path = writeLog('laravel.log', sampleLog());
    $mother = Admin::factory()->create();
    $first = logPage($mother)['entries'][2];
    file_put_contents($path, str_replace('First thing', 'Other thing', sampleLog()));

    $this->delete(route('admin.application-log.destroy'), ['file' => 'laravel.log', 'ids' => [$first['id']]])->assertSessionHas('error');

    expect(file_get_contents($path))->toContain('Other thing happened');
});

it('empties a file without deleting it', function () {
    $path = writeLog('laravel-2026-11-25.log', sampleLog());
    $inode = fileinode($path);

    $this->actingAs(Admin::factory()->create(), 'admin')
        ->delete(route('admin.application-log.clear'), ['file' => 'laravel-2026-11-25.log'])
        ->assertRedirect(route('admin.application-log.index', ['file' => 'laravel-2026-11-25.log']));

    clearstatcache();
    expect(file_exists($path))->toBeTrue()
        ->and(filesize($path))->toBe(0)
        ->and(fileinode($path))->toBe($inode);
});

it('deletes a past dated file after the password is entered twice', function () {
    $path = writeLog('laravel-2026-11-20.log', sampleLog(), 5);

    $this->actingAs(Admin::factory()->create(), 'admin')
        ->delete(route('admin.application-log.files.destroy'), ['file' => 'laravel-2026-11-20.log', 'password' => 'password', 'password_again' => 'password'])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    expect(file_exists($path))->toBeFalse();
});

it('refuses a wrong first or second password', function (string $first, string $second, string $errorKey) {
    $path = writeLog('laravel-2026-11-20.log', sampleLog(), 5);

    $this->actingAs(Admin::factory()->create(), 'admin')
        ->delete(route('admin.application-log.files.destroy'), ['file' => 'laravel-2026-11-20.log', 'password' => $first, 'password_again' => $second])
        ->assertSessionHasErrors($errorKey);

    expect(file_exists($path))->toBeTrue();
})->with([
    'wrong first' => ['nope', 'password', 'password'],
    'wrong second' => ['password', 'nope', 'password_again'],
]);

it('requires both passwords', function () {
    writeLog('laravel-2026-11-20.log', sampleLog(), 5);

    $this->actingAs(Admin::factory()->create(), 'admin')
        ->delete(route('admin.application-log.files.destroy'), ['file' => 'laravel-2026-11-20.log', 'password' => 'password'])
        ->assertSessionHasErrors('password_again');
});

it("never deletes today's file or laravel.log", function (string $name) {
    $path = writeLog($name, sampleLog());

    $this->actingAs(Admin::factory()->create(), 'admin')
        ->delete(route('admin.application-log.files.destroy'), ['file' => $name, 'password' => 'password', 'password_again' => 'password'])
        ->assertSessionHas('error');

    expect(file_exists($path))->toBeTrue();
})->with(['laravel-2026-11-25.log', 'laravel.log']);

it('shows an empty page when there are no log files', function () {
    $props = logPage(Admin::factory()->create());

    expect($props['files'])->toBe([])
        ->and($props['file'])->toBeNull()
        ->and($props['entries'])->toBe([]);
});
