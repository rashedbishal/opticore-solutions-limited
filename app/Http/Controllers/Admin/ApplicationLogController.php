<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Support\ApplicationLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Application Log (mother admin only): read storage/logs/laravel.log entry
 * by entry, newest first, and remove single entries, selected entries or
 * everything. Removing only changes the file's contents; the file stays.
 */
class ApplicationLogController extends Controller
{
    private const int PER_PAGE = 50;

    public function index(Request $request, ApplicationLog $log): Response
    {
        $this->mother();

        $index = array_reverse($log->index());
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
            'entries' => $log->read(array_slice($filtered, ($page - 1) * self::PER_PAGE, self::PER_PAGE)),
            'pagination' => ['page' => $page, 'lastPage' => $lastPage, 'total' => $total, 'perPage' => self::PER_PAGE],
            'levels' => $levels,
            'level' => isset($levels[$level]) ? $level : null,
            'file' => ['name' => basename($log->path()), 'exists' => $log->exists(), 'size' => $log->size(), 'entries' => count($index)],
        ]);
    }

    /** Removes the chosen entries (one or many). */
    public function destroy(Request $request, ApplicationLog $log): RedirectResponse
    {
        $this->mother();
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:'.self::PER_PAGE],
            'ids.*' => ['required', 'string', 'max:64'],
        ]);

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

    /** Empties the log file; the file itself stays. */
    public function clear(ApplicationLog $log): RedirectResponse
    {
        $this->mother();
        $log->clear();

        return redirect()->route('admin.application-log.index')->with('success', 'All log entries removed. The log file is now empty.');
    }

    private function mother(): Admin
    {
        $admin = Auth::guard('admin')->user();
        abort_unless($admin instanceof Admin && $admin->isMotherAdmin(), 403);

        return $admin;
    }
}
