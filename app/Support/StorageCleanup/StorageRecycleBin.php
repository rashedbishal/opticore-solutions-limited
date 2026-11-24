<?php

namespace App\Support\StorageCleanup;

use App\Models\StorageRecycleItem;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Removed files wait here (on the private disk) for 7 days so they can be
 * restored; after that the nightly clean-up deletes them for good.
 */
class StorageRecycleBin
{
    public const string FOLDER = 'storage-recycle';

    public const int KEEP_DAYS = 7;

    public function move(string $disk, string $path, ?string $by): StorageRecycleItem
    {
        $source = Storage::disk($disk);
        $binPath = self::FOLDER.'/'.Str::lower((string) Str::ulid()).'/'.basename($path);
        $size = (int) $source->size($path);
        $stream = $source->readStream($path);

        if ($stream === null || ! Storage::disk('local')->writeStream($binPath, $stream)) {
            throw new RuntimeException("Could not move {$path} to the recycle bin.");
        }

        if (is_resource($stream)) {
            fclose($stream);
        }

        $source->delete($path);

        return StorageRecycleItem::create([
            'disk' => $disk,
            'original_path' => $path,
            'bin_path' => $binPath,
            'size' => $size,
            'deleted_by_name' => $by,
            'expires_at' => now()->addDays(self::KEEP_DAYS),
        ]);
    }

    public function restore(StorageRecycleItem $item): void
    {
        $target = Storage::disk($item->disk);

        if ($target->exists($item->original_path)) {
            throw new RuntimeException('A file with the same name is already back in that place.');
        }

        $stream = Storage::disk('local')->readStream($item->bin_path);

        if ($stream === null || ! $target->writeStream($item->original_path, $stream)) {
            throw new RuntimeException('Could not restore this file.');
        }

        if (is_resource($stream)) {
            fclose($stream);
        }

        $this->forget($item);
    }

    public function forget(StorageRecycleItem $item): void
    {
        Storage::disk('local')->deleteDirectory(dirname($item->bin_path));
        $item->delete();
    }

    /** Deletes bin items older than 7 days; returns how many. */
    public function purgeExpired(): int
    {
        $count = 0;

        StorageRecycleItem::query()->where('expires_at', '<=', now())->each(function (StorageRecycleItem $item) use (&$count): void {
            $this->forget($item);
            $count++;
        });

        return $count;
    }
}
