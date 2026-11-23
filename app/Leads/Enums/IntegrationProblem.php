<?php

namespace App\Leads\Enums;

/**
 * Health warnings shown on a channel in Lead Sources (same as OptiFin's
 * Integrations page).
 */
enum IntegrationProblem: string
{
    case Quiet = 'quiet';
    case WebhookRejected = 'webhook_rejected';
    case InboxCannotConnect = 'inbox_cannot_connect';
    case EmailsFailed = 'emails_failed';
    case TokenInvalid = 'token_invalid';
    case TokenMissing = 'token_missing';
    case TokenExpiresSoon = 'token_expires_soon';

    public function label(): string
    {
        return match ($this) {
            self::Quiet => 'Quiet',
            self::WebhookRejected => 'Webhook rejected',
            self::InboxCannotConnect => 'Inbox can\'t connect',
            self::EmailsFailed => 'Emails failed',
            self::TokenInvalid => 'Token invalid',
            self::TokenMissing => 'No token',
            self::TokenExpiresSoon => 'Token expires soon',
        };
    }

    /** Serious problems mean leads are being lost right now. */
    public function isSerious(): bool
    {
        return in_array($this, [self::WebhookRejected, self::InboxCannotConnect, self::TokenInvalid, self::TokenMissing], true);
    }
}
