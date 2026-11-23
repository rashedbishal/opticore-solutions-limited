<?php

namespace App\Leads\Enums;

/**
 * A chat channel, with the reply rules Meta sets for it (same values as
 * OptiFin).
 */
enum MessageChannel: string
{
    case Messenger = 'messenger';
    case Instagram = 'instagram';
    case Whatsapp = 'whatsapp';

    public const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

    public function label(): string
    {
        return match ($this) {
            self::Messenger => 'Messenger',
            self::Instagram => 'Instagram',
            self::Whatsapp => 'WhatsApp',
        };
    }

    public static function fromSourceType(LeadSourceType $type): ?self
    {
        return match ($type) {
            LeadSourceType::FacebookMessenger => self::Messenger,
            LeadSourceType::Instagram => self::Instagram,
            LeadSourceType::Whatsapp => self::Whatsapp,
            default => null,
        };
    }

    /** Free-form replies are allowed this long after the person's last message. */
    public function windowHours(): int
    {
        return 24;
    }

    public function supportsTemplates(): bool
    {
        return $this !== self::Instagram;
    }

    /**
     * @return array<int, string>
     */
    public function imageMimeTypes(): array
    {
        return match ($this) {
            self::Messenger => ['image/jpeg', 'image/png', 'image/gif'],
            self::Whatsapp, self::Instagram => ['image/jpeg', 'image/png'],
        };
    }

    public function imageMaxBytes(): int
    {
        return match ($this) {
            self::Whatsapp => 5 * 1024 * 1024,
            self::Messenger => 25 * 1024 * 1024,
            self::Instagram => 8 * 1024 * 1024,
        };
    }

    /**
     * @return array<int, string>
     */
    public function documentMimeTypes(): array
    {
        return ['application/pdf'];
    }

    public function documentMaxBytes(): int
    {
        return self::MAX_DOCUMENT_BYTES;
    }

    /** Only WhatsApp shows text as a picture/PDF caption; elsewhere it's a separate message. */
    public function supportsMediaCaption(): bool
    {
        return $this === self::Whatsapp;
    }
}
