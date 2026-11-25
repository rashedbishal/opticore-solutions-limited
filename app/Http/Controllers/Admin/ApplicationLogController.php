<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Support\ApplicationLog;
use App\Support\ApplicationLogFiles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Application Log (mother admin only): pick a log file (laravel.log or a
 * dated laravel-YYYY-MM-DD.log), read it entry by entry, newest first, and
 * remove single entries, selected entries or everything in it. Removing
 * entries only changes a file's contents. A past dated file can also be
 * deleted as a whole, after the mother admin's password is entered twice.
 */
class ApplicationLogController extends Controller
{
    private const int PER_PAGE = 50;

    public function index(Request $request, ApplicationLogFiles $files): Response
    {
        $this->mother();

        $all = $files->all();
        $current = collect($all)->firstWhere('name', (string) $request->query('file', '')) ?? ($all[0] ?? null);
        $log = $current !== null ? $files->log($current['name']) : null;

        $index = $log !== null ? array_reverse($log->index()) : [];
        $levels = array_count_values(array_column($index, 'level'));
        ksort($levels);

        $level = (string) $request->query('level', '');
        $filtered = $level !== '' && isset($levels[$level])
            ? array_values(array_filter($index, fn (array $entry): bool => $entry['level'] === $level))
            : $index;

        $total = count($filtered);
        $lastPage = max(1, (int) ceil($total / self::PER_PAGE));
        $page = min(max(1, (int) $request->query('page', '1')), $lastPage);

        return Inertia::render('Admin/ApplicationLog/Index', [
            'files' => $all,
            'totalSize' => array_sum(array_column($all, 'size')),
            'file' => $current !== null ? [...$current, 'entries' => count($index)] : null,
            'entries' => $log?->read(array_slice($filtered, ($page - 1) * self::PER_PAGE, self::PER_PAGE)) ?? [],
            'pagination' => ['page' => $page, 'lastPage' => $lastPage, 'total' => $total, 'perPage' => self::PER_PAGE],
            'levels' => $levels,
            'level' => isset($levels[$level]) ? $level : null,
        ]);
    }

    /** Removes the chosen entries (one or many) from one file. */
    public function destroy(Request $request, ApplicationLogFiles $files): RedirectResponse
    {
        $this->mother();
        $validated = $request->validate([
            'file' => ['required', 'string', 'max:255'],
            'ids' => ['required', 'array', 'min:1', 'max:'.self::PER_PAGE],
            'ids.*' => ['required', 'string', 'max:64'],
        ]);

        $log = $this->logOrFail($files, $validated['file']);
        $requested = count($validated['ids']);
        $removed = $log->remove($validated['ids']);

        if ($removed === 0) {
            return back()->with('error', 'Nothing was removed: the log changed since the page loaded. Please refresh and try again.');
        }

        $message = $removed === 1 ? '1 log entry removed.' : "{$removed} log entries removed.";

        if ($removed < $requested) {
            $message .= ' '.($requested - $removed).' had already changed and were kept.';
        }

        return back()->with('success', $message);
    }

    /** Empties one log file; the file itself stays. */
    public function clear(Request $request, ApplicationLogFiles $files): RedirectResponse
    {
        $this->mother();
        $name = (string) $request->validate(['file' => ['required', 'string', 'max:255']])['file'];

        $this->logOrFail($files, $name)->clear();

        return redirect()->route('admin.application-log.index', ['file' => $name])
            ->with('success', "All entries removed from {$name}. The file is now empty.");
    }

    /**
     * Deletes a past dated log file for good. The mother admin's password
     * must be entered twice (two separate steps on the page).
     */
    public function destroyFile(Request $request, ApplicationLogFiles $files): RedirectResponse
    {
        $admin = $this->mother();
        $validated = $request->validate([
            'file' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
            'password_again' => ['required', 'string'],
        ]);

        if (! Hash::check($validated['password'], $admin->password)) {
            return back()->withErrors(['password' => 'The password you entered is incorrect.']);
        }

        if (! Hash::check($validated['password_again'], $admin->password)) {
            return back()->withErrors(['password_again' => 'The password you entered is incorrect.']);
        }

        $file = $files->find($validated['file']);

        if ($file === null || ! $file['can_delete']) {
            return back()->with('error', "{$validated['file']} can't be deleted. Only dated log files from before today can be.");
        }

        if (! $files->delete($file['name'])) {
            return back()->with('error', "{$file['name']} could not be deleted. Please check the folder's permissions on the server.");
        }

        return redirect()->route('admin.application-log.index')->with('success', "{$file['name']} deleted.");
    }

    private function logOrFail(ApplicationLogFiles $files, string $name): ApplicationLog
    {
        $log = $files->log($name);
        abort_if($log === null, 404);

        return $log;
    }

    private function mother(): Admin
    {
        $admin = Auth::guard('admin')->user();
        abort_unless($admin instanceof Admin && $admin->isMotherAdmin(), 403);

        return $admin;
    }
}
