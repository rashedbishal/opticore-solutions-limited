<?php

namespace App\Leads\CallingApp;

use App\Leads\Models\LeadSetting;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use ZipArchive;

/**
 * The app's APK, uploaded by the mother admin in small pieces (so a large
 * file works whatever the server's upload limit), checked to really be the
 * calling app, and its version read from the file itself (as OptiFin).
 */
class CallingAppRelease
{
    public const int CHUNK_BYTES = 786432;

    public const int MAX_BYTES = 200 * 1024 * 1024;

    private const string DIR = 'calling-app';

    /**
     * @return array{version: string, version_code: int|null, notes: string|null, size: int, path: string}|null
     */
    public function current(): ?array
    {
        $s = LeadSetting::current();

        if ($s->apk_path === null || ! Storage::disk('local')->exists($s->apk_path)) {
            return null;
        }

        return ['version' => (string) $s->apk_version, 'version_code' => $s->apk_version_code, 'notes' => $s->apk_notes, 'size' => (int) $s->apk_size, 'path' => $s->apk_path];
    }

    public function startUpload(int $size, ?string $notes): string
    {
        if ($size <= 0 || $size > self::MAX_BYTES) {
            throw new RuntimeException('The file must be between 1 byte and 200 MB.');
        }

        $this->sweepAbandonedUploads();

        $id = Str::lower((string) Str::ulid());
        Storage::disk('local')->put($this->dir($id).'/meta.json', (string) json_encode([
            'size' => $size,
            'notes' => $notes,
            'chunks' => (int) ceil($size / self::CHUNK_BYTES),
        ]));

        return $id;
    }

    public function putChunk(string $uploadId, int $index, string $bytes): void
    {
        $meta = $this->meta($uploadId);

        if ($index < 0 || $index >= $meta['chunks']) {
            throw new RuntimeException('Unexpected piece number.');
        }

        $isLast = $index === $meta['chunks'] - 1;
        $expected = $isLast ? $meta['size'] - (self::CHUNK_BYTES * ($meta['chunks'] - 1)) : self::CHUNK_BYTES;

        if (strlen($bytes) !== $expected) {
            throw new RuntimeException('Piece '.($index + 1).' arrived damaged — please try the upload again.');
        }

        Storage::disk('local')->put($this->dir($uploadId).'/'.$index.'.part', $bytes);
    }

    /**
     * @return array{version: string, version_code: int}
     */
    public function completeUpload(string $uploadId): array
    {
        $meta = $this->meta($uploadId);
        $disk = Storage::disk('local');
        $dir = $this->dir($uploadId);
        $assembled = $disk->path($dir.'/assembled.apk');
        $out = fopen($assembled, 'wb');

        if ($out === false) {
            throw new RuntimeException('Could not write the uploaded file.');
        }

        try {
            for ($i = 0; $i < $meta['chunks']; $i++) {
                if (! $disk->exists($dir.'/'.$i.'.part')) {
                    throw new RuntimeException('Part of the upload is missing — please try again.');
                }

                fwrite($out, (string) $disk->get($dir.'/'.$i.'.part'));
            }
        } finally {
            fclose($out);
        }

        try {
            if (filesize($assembled) !== $meta['size']) {
                throw new RuntimeException('The uploaded file is incomplete — please try again.');
            }

            if (! self::looksLikeApk($assembled)) {
                throw new RuntimeException('This is not an Android app (.apk) file.');
            }

            $identity = ApkManifestReader::fromApk($assembled);

            if ($identity === null || ! is_string($identity['version_name'] ?? null) || preg_match('/^\d{1,4}(\.\d{1,4}){1,3}$/', $identity['version_name']) !== 1 || ! is_int($identity['version_code'] ?? null)) {
                throw new RuntimeException('Could not read the app version from this file.');
            }

            if (($identity['package'] ?? null) !== config('calling.calling_app.android_package')) {
                throw new RuntimeException('This is not the calling app (package "'.(string) ($identity['package'] ?? '').'").');
            }

            $previous = $this->current();

            if ($previous !== null && $previous['version_code'] !== null && $identity['version_code'] < $previous['version_code']) {
                throw new RuntimeException("This file is version {$identity['version_name']}, older than the published version {$previous['version']}.");
            }

            $final = self::DIR.'/opticore-whatsapp-calling-'.$identity['version_name'].'-'.substr((string) hash_file('sha256', $assembled), 0, 8).'.apk';
            $disk->delete($final);
            $disk->move($dir.'/assembled.apk', $final);

            LeadSetting::current()->update([
                'apk_path' => $final,
                'apk_version' => $identity['version_name'],
                'apk_version_code' => $identity['version_code'],
                'apk_size' => $meta['size'],
                'apk_notes' => $meta['notes'],
                'apk_uploaded_at' => now(),
            ]);

            if ($previous !== null && $previous['path'] !== $final) {
                $disk->delete($previous['path']);
            }

            return ['version' => $identity['version_name'], 'version_code' => $identity['version_code']];
        } finally {
            $disk->deleteDirectory($dir);
        }
    }

    public function remove(): void
    {
        $current = $this->current();

        if ($current !== null) {
            Storage::disk('local')->delete($current['path']);
        }

        LeadSetting::current()->update(['apk_path' => null, 'apk_version' => null, 'apk_version_code' => null, 'apk_size' => null, 'apk_notes' => null, 'apk_uploaded_at' => null]);
    }

    public static function looksLikeApk(string $path): bool
    {
        $zip = new ZipArchive;

        if ($zip->open($path, ZipArchive::RDONLY) !== true) {
            return false;
        }

        $ok = $zip->locateName('AndroidManifest.xml') !== false && $zip->locateName('classes.dex') !== false;
        $zip->close();

        return $ok;
    }

    /**
     * @return array{size: int, notes: string|null, chunks: int}
     */
    private function meta(string $uploadId): array
    {
        if (preg_match('/^[0-9a-z]{26}$/', $uploadId) !== 1) {
            throw new RuntimeException('Unknown upload.');
        }

        $raw = Storage::disk('local')->get($this->dir($uploadId).'/meta.json');
        $meta = is_string($raw) ? json_decode($raw, true) : null;

        if (! is_array($meta)) {
            throw new RuntimeException('Unknown upload.');
        }

        return ['size' => (int) $meta['size'], 'notes' => is_string($meta['notes'] ?? null) ? $meta['notes'] : null, 'chunks' => (int) $meta['chunks']];
    }

    /**
     * Uploads left unfinished (browser closed, connection lost) for over a
     * day are deleted when a new upload starts, so their pieces don't keep
     * using disk space.
     */
    private function sweepAbandonedUploads(): void
    {
        $disk = Storage::disk('local');
        $cutoff = now()->subDay()->getTimestamp();

        foreach ($disk->directories(self::DIR.'/uploads') as $dir) {
            $meta = $dir.'/meta.json';

            if (! $disk->exists($meta) || $disk->lastModified($meta) < $cutoff) {
                $disk->deleteDirectory($dir);
            }
        }
    }

    private function dir(string $uploadId): string
    {
        return self::DIR.'/uploads/'.$uploadId;
    }
}
