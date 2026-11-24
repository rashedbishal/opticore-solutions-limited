<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\StorageRecycleItem;
use App\Support\StorageCleanup\AutomaticCleanup;
use App\Support\StorageCleanup\StorageRecycleBin;
use App\Support\StorageCleanup\UnusedFiles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Storage clean-up (mother admin only): see what uses space, find files
 * nothing uses any more, move them to a 7-day recycle bin, restore or
 * delete them for good.
 */
class StorageCleanupController extends Controller
{
    /** At most this many unused files are listed at once. */
    private const int LIST_LIMIT = 500;

    public function index(UnusedFiles $unused): Response
    {
        $this->mother();
        $files = $unused->find();
        usort($files, fn (array $a, array $b): int => $b['size'] <=> $a['size']);

        return Inertia::render('Admin/StorageCleanup/Index', [
            'usage' => $unused->usage(),
            'unused' => array_map(fn (array $f): array => [
                'disk' => $f['disk'],
                'path' => $f['path'],
                'folder' => $f['folder'],
                'name' => basename($f['path']),
                'size' => $f['size'],
                'modified_at' => date(DATE_ATOM, $f['modified']),
                'is_image' => $this->isImage($f['path']),
            ], array_slice($files, 0, self::LIST_LIMIT)),
            'unusedTotal' => ['files' => count($files), 'size' => array_sum(array_column($files, 'size'))],
            'recycle' => StorageRecycleItem::query()->latest()->get()->map(fn (StorageRecycleItem $item): array => [
                'id' => $item->id,
                'disk' => $item->disk,
                'path' => $item->original_path,
                'name' => basename($item->original_path),
                'size' => $item->size,
                'deleted_by' => $item->deleted_by_name,
                'deleted_at' => $item->created_at?->toIso8601String(),
                'expires_at' => $item->expires_at->toIso8601String(),
                'is_image' => $this->isImage($item->original_path),
            ])->all(),
            'keepDays' => StorageRecycleBin::KEEP_DAYS,
        ]);
    }

    /** Shows one unused file (for the review page's preview). */
    public function preview(Request $request, UnusedFiles $unused): StreamedResponse
    {
        $this->mother();
        $disk = (string) $request->query('disk');
        $path = (string) $request->query('path');
        abort_unless($unused->allowed($disk, $path) && Storage::disk($disk)->exists($path), 404);

        return $this->stream($disk, $path);
    }

    public function recycle(Request $request, UnusedFiles $unused, StorageRecycleBin $bin): RedirectResponse
    {
        $admin = $this->mother();
        $validated = $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:'.self::LIST_LIMIT],
            'files.*.disk' => ['required', 'string'],
            'files.*.path' => ['required', 'string', 'max:1024'],
        ]);

        $moved = 0;
        $skipped = 0;

        foreach ($validated['files'] as $file) {
            // Checked again right now: something may have started using it
            // since the page was opened.
            if (! $unused->isUnused($file['disk'], $file['path'])) {
                $skipped++;

                continue;
            }

            try {
                $bin->move($file['disk'], $file['path'], $admin->name);
                $moved++;
            } catch (RuntimeException) {
                $skipped++;
            }
        }

        $message = "{$moved} file(s) moved to the recycle bin.";

        if ($skipped > 0) {
            $message .= " {$skipped} skipped (now in use or already gone).";
        }

        return back()->with('success', $message);
    }

    public function restore(StorageRecycleItem $item, StorageRecycleBin $bin): RedirectResponse
    {
        $this->mother();

        try {
            $bin->restore($item);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'File restored.');
    }

    public function previewRecycled(StorageRecycleItem $item): StreamedResponse
    {
        $this->mother();
        abort_unless(Storage::disk('local')->exists($item->bin_path), 404);

        return $this->stream('local', $item->bin_path, basename($item->original_path));
    }

    public function destroy(StorageRecycleItem $item, StorageRecycleBin $bin): RedirectResponse
    {
        $this->mother();
        $bin->forget($item);

        return back()->with('success', 'File deleted for good.');
    }

    public function empty(StorageRecycleBin $bin): RedirectResponse
    {
        $this->mother();
        $count = 0;

        StorageRecycleItem::query()->each(function (StorageRecycleItem $item) use ($bin, &$count): void {
            $bin->forget($item);
            $count++;
        });

        return back()->with('success', "Recycle bin emptied ({$count} file(s) deleted for good).");
    }

    public function runAutomatic(AutomaticCleanup $cleanup): RedirectResponse
    {
        $this->mother();
        $done = $cleanup->run();

        return back()->with('success', sprintf(
            'Removed %d temporary file(s), %d import file(s), %d failed-send file(s) and %d expired recycle-bin file(s).',
            $done['temp'], $done['imports'], $done['failed_messages'], $done['recycle_bin'],
        ));
    }

    private function stream(string $disk, string $path, ?string $name = null): StreamedResponse
    {
        $name ??= basename($path);

        return Storage::disk($disk)->response($path, $name, [
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
        ], $this->isImage($name) ? 'inline' : 'attachment');
    }

    private function isImage(string $path): bool
    {
        return preg_match('/\.(jpe?g|png|gif|webp)$/i', $path) === 1;
    }

    private function mother(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->isMotherAdmin(), 403);

        return $admin;
    }
}
