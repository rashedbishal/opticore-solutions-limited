<?php

namespace App\Leads\Services\Messaging;

use App\Leads\Enums\MessageType;
use App\Leads\Models\LeadConversation;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Keeps a picture/PDF staff send privately on disk, named by a random id
 * (never the uploaded name), with its real type read from the file itself.
 */
class OutboundMediaStorage
{
    private const EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'application/pdf' => 'pdf',
    ];

    /**
     * @return array{message_type: MessageType, attachment_path: string, attachment_mime: string, attachment_name: string, attachment_size: int}
     */
    public function store(UploadedFile $file, LeadConversation $conversation, MessageType $type): array
    {
        $mime = self::sniffMime($file);
        $extension = self::EXTENSIONS[$mime] ?? 'bin';
        $path = Storage::disk('local')->putFileAs('leads/outbound/'.$conversation->channel->value, $file, Str::ulid().'.'.$extension);

        if ($path === false) {
            throw new RuntimeException('The outbound file could not be stored.');
        }

        $base = pathinfo(str_replace('\\', '/', $file->getClientOriginalName()), PATHINFO_FILENAME);
        $base = trim((string) preg_replace('/[\x00-\x1F\x7F\/\\\\]+/u', '', $base));

        return [
            'message_type' => $type,
            'attachment_path' => $path,
            'attachment_mime' => $mime,
            'attachment_name' => Str::limit($base !== '' ? $base : 'file', 100, '').'.'.$extension,
            'attachment_size' => (int) $file->getSize(),
        ];
    }

    public static function sniffMime(UploadedFile $file): string
    {
        $path = $file->getRealPath();
        $mime = $path === false ? false : (new \finfo(FILEINFO_MIME_TYPE))->file($path);

        return is_string($mime) ? $mime : 'application/octet-stream';
    }
}
