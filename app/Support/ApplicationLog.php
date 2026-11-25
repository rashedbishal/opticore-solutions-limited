<?php

namespace App\Support;

use RuntimeException;

/**
 * Reads and trims the application log file (storage/logs/laravel.log) for
 * the mother admin's Application Log page.
 *
 * An "entry" is everything from one `[YYYY-MM-DD HH:MM:SS] env.LEVEL:`
 * header line up to the next one, so an exception's stack trace stays with
 * its message. Each entry is identified by its byte offset, length and a
 * short content hash; a delete only removes an entry whose bytes still
 * match, so a stale page can never remove the wrong lines.
 *
 * Removing entries rewrites the file's contents in place (truncate +
 * write on the same file), so the file itself, its owner and its
 * permissions are never touched.
 */
class ApplicationLog
{
    /** Longest entry text sent to the browser; the rest is cut off. */
    public const int MAX_DETAIL_BYTES = 200_000;

    private const string HEADER = '/^\[(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2})?)\]\s+([\w-]+)\.(\w+):\s?(.*)$/';

    public function __construct(private readonly string $path) {}

    public function path(): string
    {
        return $this->path;
    }

    public function exists(): bool
    {
        return is_file($this->path);
    }

    public function size(): int
    {
        clearstatcache(true, $this->path);

        return $this->exists() ? (int) filesize($this->path) : 0;
    }

    /**
     * Every entry's position and level, oldest first. Only the header line
     * of each entry is looked at, so this stays cheap on large files.
     *
     * @return array<int, array{offset: int, length: int, level: string}>
     */
    public function index(): array
    {
        if (! $this->exists()) {
            return [];
        }

        $handle = fopen($this->path, 'rb');

        if ($handle === false) {
            throw new RuntimeException('The log file could not be opened.');
        }

        try {
            flock($handle, LOCK_SH);

            return $this->scan($handle);
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    /**
     * @param  resource  $handle
     * @return array<int, array{offset: int, length: int, level: string}>
     */
    private function scan($handle): array
    {
        rewind($handle);
        $entries = [];
        $offset = 0;

        while (($line = fgets($handle)) !== false) {
            if ($line[0] === '[' && preg_match(self::HEADER, rtrim($line, "\r\n"), $m) === 1) {
                $entries[] = ['offset' => $offset, 'length' => 0, 'level' => strtolower($m[3])];
            } elseif ($entries === []) {
                // Text before the first header (rare): keep it as its own entry.
                $entries[] = ['offset' => 0, 'length' => 0, 'level' => 'unknown'];
            }

            $offset += strlen($line);
        }

        $count = count($entries);

        foreach ($entries as $i => $entry) {
            $end = $i + 1 < $count ? $entries[$i + 1]['offset'] : $offset;
            $entries[$i]['length'] = $end - $entry['offset'];
        }

        return $entries;
    }

    /**
     * Full details of the given entries (from index()).
     *
     * @param  array<int, array{offset: int, length: int, level: string}>  $entries
     * @return array<int, array{id: string, datetime: string|null, environment: string|null, level: string, message: string, details: string, truncated: bool, size: int}>
     */
    public function read(array $entries): array
    {
        if ($entries === [] || ! $this->exists()) {
            return [];
        }

        $handle = fopen($this->path, 'rb');

        if ($handle === false) {
            throw new RuntimeException('The log file could not be opened.');
        }

        $result = [];

        try {
            foreach ($entries as $entry) {
                $raw = $this->bytes($handle, $entry['offset'], $entry['length']);
                $shown = $entry['length'] > self::MAX_DETAIL_BYTES ? substr($raw, 0, self::MAX_DETAIL_BYTES) : $raw;
                $firstLine = strtok($raw, "\n") ?: '';
                $matched = preg_match(self::HEADER, rtrim($firstLine, "\r"), $m) === 1;

                $result[] = [
                    'id' => $this->id($entry['offset'], $raw),
                    'datetime' => $matched ? $m[1] : null,
                    'environment' => $matched ? $m[2] : null,
                    'level' => $entry['level'],
                    'message' => mb_strimwidth(mb_scrub($matched ? $m[4] : $firstLine), 0, 300, '…'),
                    'details' => mb_scrub(rtrim($shown)),
                    'truncated' => $entry['length'] > self::MAX_DETAIL_BYTES,
                    'size' => $entry['length'],
                ];
            }
        } finally {
            fclose($handle);
        }

        return $result;
    }

    /**
     * Removes the entries with these ids and keeps everything else.
     * Returns how many were removed (ids that no longer match are skipped).
     *
     * @param  array<int, string>  $ids
     */
    public function remove(array $ids): int
    {
        $wanted = [];

        foreach ($ids as $id) {
            if (preg_match('/^(\d+)-(\d+)-([0-9a-f]{16})$/', $id, $m) === 1) {
                $wanted[(int) $m[1]] = ['length' => (int) $m[2], 'hash' => $m[3]];
            }
        }

        if ($wanted === [] || ! $this->exists()) {
            return 0;
        }

        return $this->rewrite(function ($handle, int $size) use ($wanted): array {
            $remove = [];

            foreach ($this->scan($handle) as $entry) {
                $target = $wanted[$entry['offset']] ?? null;

                if ($target === null || $target['length'] !== $entry['length'] || $size < $entry['offset'] + $entry['length']) {
                    continue;
                }

                $raw = $this->bytes($handle, $entry['offset'], $entry['length']);

                if (hash_equals($target['hash'], $this->hash($raw))) {
                    $remove[] = [$entry['offset'], $entry['length']];
                }
            }

            return $remove;
        });
    }

    /** Empties the log file (the file itself stays). */
    public function clear(): void
    {
        if (! $this->exists()) {
            return;
        }

        $handle = fopen($this->path, 'r+b');

        if ($handle === false) {
            throw new RuntimeException('The log file could not be opened for writing.');
        }

        try {
            flock($handle, LOCK_EX);
            ftruncate($handle, 0);
            fflush($handle);
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    /**
     * Copies the file minus the byte ranges $pick returns into a temporary
     * stream, then writes that back over the original in place.
     *
     * @param  callable(resource, int): array<int, array{0: int, 1: int}>  $pick
     */
    private function rewrite(callable $pick): int
    {
        $handle = fopen($this->path, 'r+b');

        if ($handle === false) {
            throw new RuntimeException('The log file could not be opened for writing.');
        }

        try {
            flock($handle, LOCK_EX);
            $size = (int) fstat($handle)['size'];
            $remove = $pick($handle, $size);

            if ($remove === []) {
                return 0;
            }

            usort($remove, fn (array $a, array $b): int => $a[0] <=> $b[0]);
            $temp = fopen('php://temp/maxmemory:'.(8 * 1024 * 1024), 'w+b');

            if ($temp === false) {
                throw new RuntimeException('A temporary buffer could not be created.');
            }

            try {
                $cursor = 0;

                foreach ($remove as [$offset, $length]) {
                    $this->copy($handle, $temp, $cursor, $offset - $cursor);
                    $cursor = $offset + $length;
                }

                // Includes anything written to the log while we were working.
                clearstatcache(true, $this->path);
                $size = (int) fstat($handle)['size'];
                $this->copy($handle, $temp, $cursor, $size - $cursor);

                ftruncate($handle, 0);
                rewind($handle);
                rewind($temp);
                stream_copy_to_stream($temp, $handle);
                fflush($handle);
            } finally {
                fclose($temp);
            }

            return count($remove);
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    /**
     * @param  resource  $from
     * @param  resource  $to
     */
    private function copy($from, $to, int $offset, int $length): void
    {
        if ($length > 0) {
            fseek($from, $offset);
            stream_copy_to_stream($from, $to, $length);
        }
    }

    /**
     * @param  resource  $handle
     */
    private function bytes($handle, int $offset, int $length): string
    {
        if ($length <= 0) {
            return '';
        }

        fseek($handle, $offset);

        return (string) stream_get_contents($handle, $length);
    }

    private function id(int $offset, string $raw): string
    {
        return $offset.'-'.strlen($raw).'-'.$this->hash($raw);
    }

    private function hash(string $raw): string
    {
        return substr(hash('sha256', $raw), 0, 16);
    }
}
