<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

/**
 * Resizes CMS image uploads down to the largest size they're ever actually
 * rendered at and re-encodes them as WebP, instead of storing whatever
 * resolution/format an admin happened to drag in. SVG (scalable, must never
 * be rasterized) and GIF (animation would collapse to a single frame under
 * GD) are stored as-is.
 */
class ImageUploadOptimizer
{
    private const PASSTHROUGH_MIME_TYPES = [
        'image/svg+xml',
        'image/gif',
    ];

    /**
     * Store an uploaded image, resizing (never upscaling) to fit within
     * $maxDimension on its longest side and converting to WebP.
     */
    public static function store(UploadedFile $file, string $directory, int $maxDimension, string $disk = 'public', int $quality = 82): string
    {
        $directory = trim($directory, '/');

        if (self::shouldPassThrough($file)) {
            return $file->store($directory, $disk);
        }

        $image = ImageManager::gd()->read($file->getRealPath());
        $image->scaleDown($maxDimension, $maxDimension);

        $encoded = $image->toWebp($quality);
        $path = $directory.'/'.Str::random(40).'.webp';

        Storage::disk($disk)->put($path, (string) $encoded);

        return $path;
    }

    private static function shouldPassThrough(UploadedFile $file): bool
    {
        return in_array($file->getMimeType() ?? '', self::PASSTHROUGH_MIME_TYPES, true);
    }
}
