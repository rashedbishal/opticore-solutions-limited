<?php

namespace App\Support\StorageCleanup;

use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Every stored-file path the database mentions anywhere. Rather than a
 * hand-kept list of "which column holds which file" (easy to get wrong),
 * every text/JSON column of every table, on every database the CMS uses,
 * is searched for paths under the given folders. A file is only "unused"
 * when nothing at all mentions it.
 */
class ReferenceIndex
{
    /** Database connections the CMS keeps data in. */
    private const array CONNECTIONS = ['pgsql', 'admin', 'meal'];

    /** Framework bookkeeping tables that never reference stored files. */
    private const array SKIP_TABLES = [
        'migrations', 'cache', 'cache_locks', 'sessions', 'jobs', 'job_batches', 'failed_jobs',
        'password_reset_tokens', 'personal_access_tokens', 'pulse_entries', 'pulse_aggregates',
        'pulse_values', 'storage_recycle_items',
    ];

    /** Code folders (relative to the app) that may name stored files. */
    private const array CODE_DIRECTORIES = ['app', 'config', 'database/seeders', 'resources/js', 'resources/views', 'routes', 'public/build', 'bootstrap/ssr'];

    /** @var array<string, true> */
    private array $paths = [];

    /**
     * @param  array<int, string>  $folders  top-level folders on disk
     */
    public static function build(array $folders): self
    {
        $index = new self;

        if ($folders !== []) {
            foreach (self::CONNECTIONS as $connection) {
                $index->scanConnection($connection, $folders);
            }

            $index->scanCode($folders);
        }

        return $index;
    }

    public function mentions(string $path): bool
    {
        return isset($this->paths[$path]);
    }

    /**
     * Pictures the website's own code points at directly (not through the
     * database) also count as used.
     *
     * @param  array<int, string>  $folders
     */
    private function scanCode(array $folders): void
    {
        $regex = $this->regex($folders);

        foreach (self::CODE_DIRECTORIES as $directory) {
            $root = base_path($directory);

            if (! is_dir($root)) {
                continue;
            }

            $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS));

            foreach ($files as $file) {
                if (! $file instanceof \SplFileInfo || ! $file->isFile() || $file->getSize() > 5 * 1024 * 1024) {
                    continue;
                }

                if (preg_match('/\.(php|tsx?|jsx?|mjs|css|json|html|md)$/', $file->getFilename()) !== 1) {
                    continue;
                }

                $this->collect((string) file_get_contents($file->getPathname()), $regex);
            }
        }
    }

    /**
     * @param  array<int, string>  $folders
     */
    private function scanConnection(string $connection, array $folders): void
    {
        if (config("database.connections.{$connection}") === null) {
            return;
        }

        try {
            $db = DB::connection($connection);

            if ($db->getDriverName() !== 'pgsql') {
                return;
            }

            $columns = $db->select(
                "select table_name, column_name from information_schema.columns
                 where table_schema = current_schema()
                   and data_type in ('character varying', 'text', 'json', 'jsonb')",
            );
        } catch (Throwable) {
            return;
        }

        $patterns = array_map(fn (string $f): string => '%'.str_replace(['%', '_'], ['\\%', '\\_'], $f).'/%', $folders);
        $placeholders = implode(',', array_fill(0, count($patterns), '?'));
        $regex = $this->regex($folders);

        foreach ($columns as $column) {
            $table = (string) $column->table_name;

            if (in_array($table, self::SKIP_TABLES, true)) {
                continue;
            }

            $col = (string) $column->column_name;

            try {
                $values = $db->table($table)
                    ->whereRaw('"'.str_replace('"', '""', $col)."\"::text like any (array[{$placeholders}])", $patterns)
                    ->pluck($col);
            } catch (Throwable) {
                continue;
            }

            foreach ($values as $value) {
                $this->collect(is_string($value) ? $value : (string) json_encode($value), $regex);
            }
        }
    }

    private function collect(string $text, string $regex): void
    {
        // JSON stores "a\/b": read it as "a/b".
        $text = str_replace('\\/', '/', $text);

        if (preg_match_all($regex, $text, $matches) > 0) {
            foreach ($matches[1] as $path) {
                $this->paths[rawurldecode($path)] = true;
            }
        }
    }

    /**
     * @param  array<int, string>  $folders
     */
    private function regex(array $folders): string
    {
        $names = implode('|', array_map(fn (string $f): string => preg_quote($f, '#'), $folders));

        return '#(?<![A-Za-z0-9_.-])((?:'.$names.')/[^\s"\'<>()?\#\\\\,]+)#';
    }
}
