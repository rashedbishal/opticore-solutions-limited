<?php

namespace App\Support;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Process\Process;
use ZipArchive;

/**
 * Dumps all three Postgres databases (client/pgsql, admin, meal) via the
 * native `pg_dump` binary — not a hand-rolled table-by-table export — so a
 * future migration adding/removing tables in any of them needs no changes
 * here; pg_dump always captures whatever schema exists at dump time. Plain
 * SQL format (not pg_dump's custom -Fc format) so the result is restorable
 * with nothing more than `psql -d dbname < file.sql`, no pg_restore needed.
 */
class DatabaseBackupService
{
    /**
     * Connection name => label used for both the per-database .sql filename
     * inside the zip and in error messages.
     *
     * @var array<string, string>
     */
    private const CONNECTIONS = [
        'pgsql' => 'client',
        'admin' => 'admin',
        'meal' => 'meal',
    ];

    /**
     * @return string absolute path to the generated zip archive — caller is
     *                responsible for deleting it once sent
     */
    public function createZipArchive(): string
    {
        $workDir = storage_path('app/private/db-backups/'.Str::uuid());
        File::makeDirectory($workDir, 0700, true);

        try {
            $sqlFiles = [];

            foreach (self::CONNECTIONS as $connectionName => $label) {
                $sqlFiles[$label] = $this->dumpConnection($connectionName, $label, $workDir);
            }

            return $this->zip($sqlFiles);
        } finally {
            // The zip already has everything it needs by this point —
            // always clean up the raw .sql files, success or failure, so a
            // failed backup doesn't leave a partial dump sitting on disk.
            File::deleteDirectory($workDir);
        }
    }

    private function dumpConnection(string $connectionName, string $label, string $workDir): string
    {
        $config = config("database.connections.{$connectionName}");
        $sqlPath = "{$workDir}/{$label}-database.sql";

        $process = new Process([
            'pg_dump',
            '--host='.$config['host'],
            '--port='.$config['port'],
            '--username='.$config['username'],
            // Portability: the account restoring this backup later (on
            // this server or a fresh one) won't necessarily be the same
            // Postgres role that owns these tables today — objects/grants
            // tied to that exact role name would otherwise fail to restore.
            '--no-owner',
            '--no-privileges',
            '--format=plain',
            '--file='.$sqlPath,
            $config['database'],
        ]);
        // pg_dump's own timeout, independent of the 5-minute ceiling set on
        // the whole request in the controller — each individual database
        // gets its own budget rather than sharing one across all three.
        $process->setTimeout(240);
        // Password via env, never argv — argv is visible to any other
        // process on the box via `ps aux`, env vars of another process
        // are not.
        $process->setEnv(['PGPASSWORD' => (string) $config['password']]);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException("Failed to back up the {$label} database: ".$process->getErrorOutput());
        }

        return $sqlPath;
    }

    /**
     * @param  array<string, string>  $sqlFiles  label => absolute path
     */
    private function zip(array $sqlFiles): string
    {
        $zipPath = storage_path('app/private/db-backups/opticore-backup-'.now()->format('Y-m-d_His').'.zip');

        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE) !== true) {
            throw new RuntimeException('Failed to create the backup zip archive.');
        }

        foreach ($sqlFiles as $label => $path) {
            $zip->addFile($path, "{$label}-database.sql");
        }

        $zip->close();

        return $zipPath;
    }
}
