<?php

namespace App\Leads\CallingApp;

use App\Leads\Models\LeadSetting;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Factory;
use RuntimeException;

/**
 * The app's Firebase project key, uploaded by the mother admin and stored
 * encrypted in Lead Settings (not .env).
 */
class CallingAppFirebase
{
    public function isConfigured(): bool
    {
        return LeadSetting::current()->firebase_service_account !== null;
    }

    /**
     * @return array{project_id: string, client_email: string}|null
     */
    public function summary(): ?array
    {
        $account = LeadSetting::current()->firebase_service_account;

        return is_array($account)
            ? ['project_id' => (string) ($account['project_id'] ?? ''), 'client_email' => (string) ($account['client_email'] ?? '')]
            : null;
    }

    public static function validationError(mixed $account): ?string
    {
        if (! is_array($account)
            || ($account['type'] ?? null) !== 'service_account'
            || ! is_string($account['project_id'] ?? null)
            || ! is_string($account['client_email'] ?? null)
            || ! is_string($account['private_key'] ?? null)
            || ! str_contains($account['private_key'], 'PRIVATE KEY')) {
            return 'This is not a Firebase service account key file. In Firebase: Project settings → Service accounts → Generate new private key.';
        }

        $expected = (string) config('calling.calling_app.firebase_project_id');

        if ($expected !== '' && $account['project_id'] !== $expected) {
            return "This key belongs to Firebase project \"{$account['project_id']}\", but the calling app uses \"{$expected}\".";
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $account
     */
    public function store(array $account): void
    {
        LeadSetting::current()->update(['firebase_service_account' => $account]);
    }

    public function remove(): void
    {
        LeadSetting::current()->update(['firebase_service_account' => null]);
    }

    public function messaging(): Messaging
    {
        $account = LeadSetting::current()->firebase_service_account;

        if (! is_array($account)) {
            throw new RuntimeException('The calling app Firebase key is not set (Lead Settings → Calling app).');
        }

        return (new Factory)->withServiceAccount($account)->createMessaging();
    }
}
