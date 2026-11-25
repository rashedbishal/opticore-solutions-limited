<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/**
 * The log files in storage/logs that the Application Log page can show:
 * the `single` channel's laravel.log and the `daily` channel's dated
 * laravel-YYYY-MM-DD.log files. Nothing else in that folder is ever
 * listed, read or deleted, and a file is only reachable by a name this
 * class listed (so no path tricks).
 */
class ApplicationLogFiles
{
    public function __construct(
        private readonly string $directory,
        private readonly string $baseName = 'laravel',
    ) {}

    /**
     * Newest first (by last write).
     *
     * @return array<int, array{name: string, size: int, modified_at: string, date: string|null, is_today: bool, can_delete: bool}>
     */
    public function all(): array
    {
        $files = [];
        $pattern = '/^'.preg_quote($this->baseName, '/').'(?:-(\d{4}-\d{2}-\d{2}))?\.log$/';
        $today = Carbon::now()->format('Y-m-d');

        foreach (glob($this->directory.DIRECTORY_SEPARATOR.$this->baseName.'*.log') ?: [] as $path) {
            $name = basename($path);

            if (! is_file($path) || preg_match($pattern, $name, $m) !== 1) {
                continue;
            }

            $date = $m[1] ?? null;
            $files[] = [
                'name' => $name,
                'size' => (int) filesize($path),
                'modified' => (int) filemtime($path),
                'date' => $date,
                'is_today' => $date === $today,
                // Only past dated files: today's is still being written to,
                // and the undated laravel.log is the `single` channel's file.
                'can_delete' => $date !== null && $date < $today,
            ];
        }

        usort($files, fn (array $a, array $b): int => [$b['modified'], $b['name']] <=> [$a['modified'], $a['name']]);

        return array_map(fn (array $file): array => [
            'name' => $file['name'],
            'size' => $file['size'],
            'modified_at' => date(DATE_ATOM, $file['modified']),
            'date' => $file['date'],
            'is_today' => $file['is_today'],
            'can_delete' => $file['can_delete'],
        ], $files);
    }

    /** @return array{name: string, size: int, modified_at: string, date: string|null, is_today: bool, can_delete: bool}|null */
    public function find(string $name): ?array
    {
        foreach ($this->all() as $file) {
            if ($file['name'] === $name) {
                return $file;
            }
        }

        return null;
    }

    public function log(string $name): ?ApplicationLog
    {
        return $this->find($name) !== null ? new ApplicationLog($this->path($name)) : null;
    }

    /** Deletes a past dated log file. Returns false when it isn't one. */
    public function delete(string $name): bool
    {
        $file = $this->find($name);

        if ($file === null || ! $file['can_delete']) {
            return false;
        }

        return @unlink($this->path($name));
    }

    private function path(string $name): string
    {
        return $this->directory.DIRECTORY_SEPARATOR.$name;
    }
}
