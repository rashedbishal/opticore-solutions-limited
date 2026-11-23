<?php

namespace App\Leads\Enums;

/**
 * Where a lead came from, and what each kind of source needs set up.
 * Setup fields and their validation match OptiFin.
 */
enum LeadSourceType: string
{
    case Manual = 'manual';
    case ContactForm = 'contact_form';
    case FacebookMessenger = 'facebook_messenger';
    case FacebookLeadAds = 'facebook_lead_ads';
    case Whatsapp = 'whatsapp';
    case Instagram = 'instagram';
    case LinkedInLeadGen = 'linkedin_lead_gen';
    case Email = 'email';

    public function label(): string
    {
        return match ($this) {
            self::Manual => 'Manual',
            self::ContactForm => 'Website Contact Form',
            self::FacebookMessenger => 'Facebook Messenger',
            self::FacebookLeadAds => 'Facebook Lead Ads',
            self::Whatsapp => 'WhatsApp',
            self::Instagram => 'Instagram',
            self::LinkedInLeadGen => 'LinkedIn Lead Gen Forms',
            self::Email => 'Email Inbox',
        };
    }

    /** One-per-system sources the CMS creates itself; never added by hand. */
    public function isBuiltIn(): bool
    {
        return in_array($this, [self::Manual, self::ContactForm], true);
    }

    public function isMeta(): bool
    {
        return in_array($this, [self::FacebookMessenger, self::FacebookLeadAds, self::Whatsapp, self::Instagram], true);
    }

    /**
     * The types the mother admin can add from the Lead Sources page.
     *
     * @return array<int, self>
     */
    public static function addable(): array
    {
        return array_values(array_filter(self::cases(), fn (self $type): bool => ! $type->isBuiltIn()));
    }

    /**
     * @return array<int, array{key: string, label: string, type: string, sensitive: bool, options?: array<string, string>}>
     */
    public function configFields(): array
    {
        $appSecret = ['key' => 'app_secret', 'label' => 'App Secret (enables webhook signature verification)', 'type' => 'password', 'sensitive' => true];
        $verifyToken = ['key' => 'verify_token', 'label' => 'Verify Token', 'type' => 'password', 'sensitive' => true];

        return match ($this) {
            self::FacebookMessenger, self::FacebookLeadAds => [
                ['key' => 'page_id', 'label' => 'Page ID', 'type' => 'text', 'sensitive' => false],
                ['key' => 'page_access_token', 'label' => 'Page Access Token', 'type' => 'password', 'sensitive' => true],
                $verifyToken,
                $appSecret,
            ],
            self::Whatsapp => [
                ['key' => 'phone_number_id', 'label' => 'Phone Number ID', 'type' => 'text', 'sensitive' => false],
                ['key' => 'access_token', 'label' => 'Access Token', 'type' => 'password', 'sensitive' => true],
                $verifyToken,
                $appSecret,
                ['key' => 'whatsapp_business_account_id', 'label' => 'WhatsApp Business Account ID (enables automatic webhook subscription on Test Connection)', 'type' => 'text', 'sensitive' => false],
            ],
            self::Instagram => [
                ['key' => 'auth_mode', 'label' => 'Login Via', 'type' => 'select', 'sensitive' => false, 'options' => [
                    'facebook' => 'Instagram Login via Facebook',
                    'instagram' => 'Instagram Login via Instagram',
                ]],
                ['key' => 'instagram_account_id', 'label' => 'Instagram Business Account ID', 'type' => 'text', 'sensitive' => false],
                ['key' => 'access_token', 'label' => 'Access Token', 'type' => 'password', 'sensitive' => true],
                $verifyToken,
                $appSecret,
            ],
            self::LinkedInLeadGen => [
                ['key' => 'organization_urn', 'label' => 'Organization / Sponsored Account URN', 'type' => 'text', 'sensitive' => false],
                ['key' => 'lead_type', 'label' => 'Lead Type', 'type' => 'select', 'sensitive' => false, 'options' => [
                    'SPONSORED' => 'Sponsored (Ads)',
                    'EVENT' => 'Event',
                    'COMPANY' => 'Company Page',
                    'ORGANIZATION_PRODUCT' => 'Organization Product',
                ]],
                ['key' => 'access_token', 'label' => 'Access Token', 'type' => 'password', 'sensitive' => true],
                ['key' => 'refresh_token', 'label' => 'Refresh Token', 'type' => 'password', 'sensitive' => true],
            ],
            self::Email => [
                ['key' => 'email_address', 'label' => 'Email Address', 'type' => 'text', 'sensitive' => false],
                ['key' => 'imap_host', 'label' => 'IMAP Host', 'type' => 'text', 'sensitive' => false],
                ['key' => 'imap_port', 'label' => 'IMAP Port', 'type' => 'text', 'sensitive' => false],
                ['key' => 'imap_username', 'label' => 'IMAP Username', 'type' => 'text', 'sensitive' => false],
                ['key' => 'imap_password', 'label' => 'IMAP Password', 'type' => 'password', 'sensitive' => true],
                ['key' => 'fetch_interval_minutes', 'label' => 'Check every (minutes)', 'type' => 'text', 'sensitive' => false],
            ],
            self::Manual, self::ContactForm => [],
        };
    }

    /**
     * Secrets are required when adding a source, but may be left blank when
     * editing to keep the saved value.
     *
     * @return array<string, array<int, string>>
     */
    public function configValidationRules(bool $isUpdate = false): array
    {
        $secret = $isUpdate ? 'nullable' : 'required';

        return match ($this) {
            self::FacebookMessenger, self::FacebookLeadAds => [
                'config.page_id' => ['required', 'string', 'max:255'],
                'config.page_access_token' => [$secret, 'string'],
                'config.verify_token' => [$secret, 'string'],
                'config.app_secret' => ['nullable', 'string'],
            ],
            self::Whatsapp => [
                'config.phone_number_id' => ['required', 'string', 'max:255'],
                'config.access_token' => [$secret, 'string'],
                'config.verify_token' => [$secret, 'string'],
                'config.app_secret' => ['nullable', 'string'],
                'config.whatsapp_business_account_id' => ['nullable', 'string', 'max:255'],
            ],
            self::Instagram => [
                'config.auth_mode' => ['required', 'in:facebook,instagram'],
                'config.instagram_account_id' => ['required', 'string', 'max:255'],
                'config.access_token' => [$secret, 'string'],
                'config.verify_token' => [$secret, 'string'],
                'config.app_secret' => ['nullable', 'string'],
            ],
            self::LinkedInLeadGen => [
                'config.organization_urn' => ['required', 'string', 'starts_with:urn:li:', 'max:255'],
                'config.lead_type' => ['required', 'in:SPONSORED,EVENT,COMPANY,ORGANIZATION_PRODUCT'],
                'config.access_token' => ['nullable', 'string'],
                'config.refresh_token' => ['nullable', 'string'],
            ],
            self::Email => [
                'config.email_address' => ['required', 'email', 'max:255'],
                'config.imap_host' => ['required', 'string', 'max:255'],
                'config.imap_port' => ['required', 'integer', 'min:1', 'max:65535'],
                'config.imap_username' => ['required', 'string', 'max:255'],
                'config.imap_password' => [$secret, 'string'],
                'config.fetch_interval_minutes' => ['nullable', 'integer', 'min:1'],
            ],
            self::Manual, self::ContactForm => [],
        };
    }

    /**
     * @return array<int, string>
     */
    public function sensitiveConfigKeys(): array
    {
        return array_values(array_map(
            fn (array $field): string => $field['key'],
            array_filter($this->configFields(), fn (array $field): bool => $field['sensitive']),
        ));
    }
}
