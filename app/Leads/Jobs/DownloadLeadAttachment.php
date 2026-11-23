<?php

namespace App\Leads\Jobs;

use App\Leads\Enums\LeadAttachmentStatus;
use App\Leads\Events\LeadUpdated;
use App\Leads\Models\LeadAttachment;
use App\Leads\Services\Meta\MetaGraph;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Mime\MimeTypes;
use Throwable;

/**
 * Downloads a picture/video/voice note/file a lead sent onto the private
 * disk. Only Meta's own media hosts are ever fetched; oversized files are
 * refused. Same rules as OptiFin.
 */
class DownloadLeadAttachment implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 180;

    private const ALLOWED_HOST_SUFFIXES = ['fbcdn.net', 'fbsbx.com', 'cdninstagram.com'];

    public function __construct(
        public LeadAttachment $attachment,
        public string $senderId,
        public string $platform,
        public ?string $remoteUrl = null,
        public ?string $mediaId = null,
    ) {}

    public function handle(MetaGraph $graph): void
    {
        if (! LeadAttachment::query()->whereKey($this->attachment->getKey())->exists()) {
            return;
        }

        $source = $this->attachment->lead->source;
        $token = $source->metaAccessToken();

        if ($token === null) {
            $this->markFailed('Lead source credential is no longer configured.');

            return;
        }

        try {
            $download = $this->platform === 'whatsapp'
                ? $this->downloadWhatsappMedia($graph, $token, $source->config['phone_number_id'] ?? null)
                : $this->downloadCdnAttachment($token);
        } catch (Throwable $e) {
            $this->markFailed($e->getMessage());

            return;
        }

        if ($download === null) {
            return;
        }

        $this->attachment->update([
            'path' => $download['path'],
            'mime' => $download['mime'],
            'original_media_url' => $download['source_url'],
            'status' => LeadAttachmentStatus::Downloaded,
            'failure_reason' => null,
        ]);

        LeadUpdated::dispatch($this->attachment->lead_id);
    }

    /**
     * @return array{path: string, mime: string, source_url: string}|null
     */
    private function downloadCdnAttachment(string $token): ?array
    {
        if ($this->remoteUrl === null) {
            $this->markFailed('No remote URL was provided.');

            return null;
        }

        if (! $this->hostIsAllowed((string) parse_url($this->remoteUrl, PHP_URL_HOST))) {
            $this->markFailed('Disallowed host in attachment URL.');

            return null;
        }

        $tmp = $this->tempPath();
        $response = Http::timeout(60)->withOptions(['sink' => $tmp])->get($this->remoteUrl);

        if (! $response->successful()) {
            $separator = str_contains($this->remoteUrl, '?') ? '&' : '?';
            $response = Http::timeout(60)->withOptions(['sink' => $tmp])->get($this->remoteUrl.$separator.'access_token='.urlencode($token));
        }

        if (! $response->successful()) {
            @unlink($tmp);
            $this->markFailed("Download returned HTTP {$response->status()}.");

            return null;
        }

        return $this->finalize($tmp, $response->header('Content-Type'), $this->remoteUrl);
    }

    /**
     * @return array{path: string, mime: string, source_url: string}|null
     */
    private function downloadWhatsappMedia(MetaGraph $graph, string $token, ?string $phoneNumberId): ?array
    {
        if ($this->mediaId === null) {
            $this->markFailed('No WhatsApp media id was provided.');

            return null;
        }

        $lookup = $graph->whatsappMediaLookup($this->mediaId, $token, $phoneNumberId);

        if (! $lookup->successful()) {
            $this->markFailed("WhatsApp media lookup HTTP {$lookup->status()}.");

            return null;
        }

        $mediaUrl = $lookup->json('url');

        if (! is_string($mediaUrl) || $mediaUrl === '' || ! $this->hostIsAllowed((string) parse_url($mediaUrl, PHP_URL_HOST))) {
            $this->markFailed('WhatsApp media lookup returned no usable URL.');

            return null;
        }

        $tmp = $this->tempPath();
        $response = Http::withToken($token)->timeout(120)->withOptions(['sink' => $tmp])->get($mediaUrl);

        if (! $response->successful()) {
            @unlink($tmp);
            $this->markFailed("WhatsApp media download returned HTTP {$response->status()}.");

            return null;
        }

        return $this->finalize($tmp, $lookup->json('mime_type'), $mediaUrl);
    }

    private function hostIsAllowed(string $host): bool
    {
        $host = strtolower($host);

        foreach (self::ALLOWED_HOST_SUFFIXES as $suffix) {
            if ($host === $suffix || str_ends_with($host, '.'.$suffix)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array{path: string, mime: string, source_url: string}|null
     */
    private function finalize(string $tmp, ?string $mime, string $sourceUrl): ?array
    {
        $mime = $mime !== null ? trim(explode(';', $mime)[0]) : '';
        $mime = $mime !== '' ? $mime : (mime_content_type($tmp) ?: 'application/octet-stream');
        $size = @filesize($tmp) ?: 0;
        $limits = config('leads.attachment_max_bytes');
        $max = (int) ($limits[$this->platform] ?? $limits['facebook_messenger']);

        if ($size === 0 || $size > $max) {
            @unlink($tmp);
            $this->markFailed("Rejected: {$size} bytes (limit {$max}).");

            return null;
        }

        $extension = MimeTypes::getDefault()->getExtensions($mime)[0] ?? 'bin';
        $relative = $this->directory().'/'.Str::slug($this->senderId).'_'.Str::ulid().'.'.$extension;
        rename($tmp, Storage::disk('local')->path($relative));

        return ['path' => $relative, 'mime' => $mime, 'source_url' => $sourceUrl];
    }

    private function directory(): string
    {
        return 'leads/'.($this->platform === 'facebook_messenger' ? 'messenger' : $this->platform);
    }

    private function tempPath(): string
    {
        Storage::disk('local')->makeDirectory($this->directory());

        return Storage::disk('local')->path($this->directory().'/.tmp_'.Str::random(24));
    }

    private function markFailed(string $reason): void
    {
        Log::warning("Lead attachment download failed for attachment [{$this->attachment->id}]: {$reason}");

        $this->attachment->update(['status' => LeadAttachmentStatus::Failed, 'failure_reason' => $reason]);
    }
}
