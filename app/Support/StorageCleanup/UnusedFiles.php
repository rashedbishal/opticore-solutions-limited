<?php

namespace App\Support\StorageCleanup;

use Illuminate\Support\Facades\Storage;

/**
 * Finds stored files nothing in the CMS uses any more, on the public disk
 * (website images) and the private disk (CVs, chat files, lead files…).
 *
 * Never listed: files changed in the last 24 hours (maybe mid-upload),
 * hidden files, and protected folders — invoices (named from invoice
 * numbers, not stored paths), the recycle bin, and the calling-app
 * download.
 */
class UnusedFiles
{
    public const array DISKS = ['public', 'local'];

    /** @var array<string, array<int, string>> */
    public const array PROTECTED = [
        'local' => ['invoices', StorageRecycleBin::FOLDER, 'calling-app', 'livewire-tmp'],
        'public' => [],
    ];

    /**
     * @return array<int, array{disk: string, path: string, folder: string, size: int, modified: int}>
     */
    public function find(): array
    {
        $candidates = [];

        foreach (self::DISKS as $disk) {
            foreach ($this->files($disk) as $file) {
                $candidates[] = $file;
            }
        }

        if ($candidates === []) {
            return [];
        }

        $folders = array_values(array_unique(array_map(fn (array $f): string => explode('/', $f['path'])[0], $candidates)));
        $index = ReferenceIndex::build($folders);

        return array_values(array_filter($candidates, fn (array $f): bool => ! $index->mentions($f['path'])));
    }

    /**
     * Is this one file unused right now? (Checked again just before it's
     * moved to the recycle bin.)
     */
    public function isUnused(string $disk, string $path): bool
    {
        if (! $this->allowed($disk, $path) || ! Storage::disk($disk)->exists($path)) {
            return false;
        }

        return ! ReferenceIndex::build([explode('/', $path)[0]])->mentions($path);
    }

    /**
     * Space used per top-level folder, for the overview.
     *
     * @return array<int, array{disk: string, folder: string, files: int, size: int}>
     */
    public function usage(): array
    {
        $rows = [];

        foreach (self::DISKS as $disk) {
            $storage = Storage::disk($disk);

            foreach ($storage->allFiles() as $path) {
                if (str_starts_with(basename($path), '.')) {
                    continue;
                }

                $folder = str_contains($path, '/') ? explode('/', $path)[0] : '(top level)';
                $key = "{$disk}:{$folder}";
                $rows[$key] ??= ['disk' => $disk, 'folder' => $folder, 'files' => 0, 'size' => 0];
                $rows[$key]['files']++;
                $rows[$key]['size'] += (int) $storage->size($path);
            }
        }

        usort($rows, fn (array $a, array $b): int => $b['size'] <=> $a['size']);

        return $rows;
    }

    public function allowed(string $disk, string $path): bool
    {
        if (! in_array($disk, self::DISKS, true) || $path === '' || str_contains($path, '..') || str_starts_with($path, '/')) {
            return false;
        }

        if (str_starts_with(basename($path), '.') || ! str_contains($path, '/')) {
            return false;
        }

        $folder = explode('/', $path)[0];

        return ! in_array($folder, self::PROTECTED[$disk], true);
    }

    /**
     * @return array<int, array{disk: string, path: string, folder: string, size: int, modified: int}>
     */
    private function files(string $disk): array
    {
        $storage = Storage::disk($disk);
        $cutoff = now()->subDay()->getTimestamp();
        $found = [];

        foreach ($storage->allFiles() as $path) {
            if (! $this->allowed($disk, $path)) {
                continue;
            }

            $modified = (int) $storage->lastModified($path);

            if ($modified > $cutoff) {
                continue;
            }

            $found[] = [
                'disk' => $disk,
                'path' => $path,
                'folder' => explode('/', $path)[0],
                'size' => (int) $storage->size($path),
                'modified' => $modified,
            ];
        }

        return $found;
    }
}
