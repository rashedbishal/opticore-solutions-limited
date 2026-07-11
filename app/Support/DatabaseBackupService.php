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
 * here; pg_dump always captures whatever schema exists at dump time.
 * Custom format (-Fc), Postgres's own recommended format for backups you
 * intend to keep: compressed, and restorable selectively/in parallel via
 * `pg_restore -d dbname file.dump` (plain SQL was the original choice here,
 * switched to custom format for the smaller download size and restore
 * flexibility).
 */
class DatabaseBackupService
{
    /**
     * Connection name => label used for both the per-database .dump filename
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
            $dumpFiles = [];

            foreach (self::CONNECTIONS as $connectionName => $label) {
                $dumpFiles[$label] = $this->dumpConnection($connectionName, $label, $workDir);
            }

            return $this->zip($dumpFiles);
        } finally {
            // The zip already has everything it needs by this point —
            // always clean up the raw .dump files, success or failure, so a
            // failed backup doesn't leave a partial dump sitting on disk.
            File::deleteDirectory($workDir);
        }
    }

    private function dumpConnection(string $connectionName, string $label, string $workDir): string
    {
        $config = config("database.connections.{$connectionName}");
        $dumpPath = "{$workDir}/{$label}-database.dump";

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
            // Custom format: compressed, and pg_restore can go selective/
            // parallel with it — not restorable via plain psql, needs
            // pg_restore specifically.
            '--format=custom',
            '--file='.$dumpPath,
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

        return $dumpPath;
    }

    /**
     * @param  array<string, string>  $dumpFiles  label => absolute path
     */
    private function zip(array $dumpFiles): string
    {
        $zipPath = storage_path('app/private/db-backups/opticore-backup-'.now()->format('Y-m-d_His').'.zip');

        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE) !== true) {
            throw new RuntimeException('Failed to create the backup zip archive.');
        }

        foreach ($dumpFiles as $label => $path) {
            $zip->addFile($path, "{$label}-database.dump");
        }

        $zip->close();

        return $zipPath;
    }
}
